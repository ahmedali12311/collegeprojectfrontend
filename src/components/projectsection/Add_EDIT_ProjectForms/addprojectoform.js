import React, { useState, useEffect } from "react";
import ProjectFormFields from './ProjectFormFields';
import SimilarProjectsDialog from './SimilarProjectsDialog';
import { validateProjectForm } from '../utils/formValidation';
import { submitProjectForm, fetchTeachers, fetchStudents } from '../utils/api';

const AddProjectForm = ({ closeForm, refreshProjects }) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from(new Array(currentYear - 2008 + 1), (val, index) => 2008 + index);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    students: [""],
    advisors: [""],
    discutants: [""],
    year: "",
    season: "",
    file: null,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [similarProjects, setSimilarProjects] = useState([]);

  useEffect(() => {
    Promise.all([
      fetchTeachers().catch(error => {
        console.error("Error fetching teachers:", error);
        return [];
      }),
      fetchStudents().catch(error => {
        console.error("Error fetching students:", error);
        return [];
      })
    ]).then(([teachersData, studentsData]) => {
      setTeachers(teachersData);
      setStudents(studentsData);
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, file: e.target.files[0] }));
  };

  const handleDynamicFieldChange = (field, index, value) => {
    setFormData(prev => {
      const updatedField = [...prev[field]];
      updatedField[index] = value;
      return { ...prev, [field]: updatedField };
    });
  };

  const addDynamicField = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
  };

  const removeDynamicField = (field, index) => {
    setFormData(prev => {
      const updatedField = [...prev[field]];
      updatedField.splice(index, 1);
      return { ...prev, [field]: updatedField };
    });
  };

  const handleSubmit = async (e, confirm = false) => {
    e?.preventDefault();
    setIsSubmitting(true);
  
    // Filter out empty students
    const filteredFormData = {
      ...formData,
      students: formData.students.filter(student => student !== ""),
    };
  
    const validationErrors = validateProjectForm(filteredFormData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }
  
    try {
      await submitProjectForm(filteredFormData, null, confirm);
      refreshProjects();
      closeForm();
    } catch (error) {
      console.error("Error adding project:", error);
      
      if (error.error?.similar_projects) {
        setSimilarProjects(error.error.similar_projects);
        setShowConfirmation(true);
      } else {
        handleErrors(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleErrors = (error) => {
    const backendErrors = {};
    if (error.error) {
      if (error.error.name) backendErrors.name = error.error.name;
      if (error.error.description) backendErrors.description = error.error.description;
      if (error.error.advisor) backendErrors.advisors = error.error.advisor;
      if (error.error.student) backendErrors.students = error.error.student;
      if (error.error.discutant) backendErrors.discutants = error.error.discutant;
      if (error.error.year) backendErrors.year = error.error.year;
      if (error.error.season) backendErrors.season = error.error.season;
    }
    setErrors({
      ...backendErrors,
      general: "حدث خطأ في إضافة المشروع. يرجى التحقق من المدخلات."
    });
  };

  return (
    <div className="overlay-content">
      <h2>إضافة مشروع جديد</h2>
      
      {showConfirmation ? (
        <SimilarProjectsDialog
          similarProjects={similarProjects}
          isSubmitting={isSubmitting}
          onConfirm={(e) => handleSubmit(e, true)}
          onCancel={() => setShowConfirmation(false)}
        />
      ) : (
        <form onSubmit={handleSubmit}>
          {errors.general && <div className="error-message">{errors.general}</div>}
          
          <ProjectFormFields
            formData={formData}
            errors={errors}
            isSubmitting={isSubmitting}
            handleChange={handleChange}
            handleFileChange={handleFileChange}
            handleDynamicFieldChange={handleDynamicFieldChange}
            addDynamicField={addDynamicField}
            removeDynamicField={removeDynamicField}
            teachers={teachers}
            students={students}
            years={years}
          />

          <div className="form-actions">
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "جاري الإضافة..." : "إضافة مشروع"}
            </button>
            <button 
              type="button" 
              onClick={closeForm} 
              disabled={isSubmitting} 
              className="cancel-button"
            >
              إلغاء
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AddProjectForm;