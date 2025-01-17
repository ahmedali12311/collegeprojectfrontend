import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const AddPreProjectForm = ({ closeForm, refreshProjects }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    students: [],
    advisors: [""],
    year: "",
    season: "",
    file: null,
    file_description: "", // Add this

  });

  const [userEmail, setUserEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);

  const currentYear = new Date().getFullYear();
  const years = [
    currentYear,
    currentYear + 1  
  ];    
  useEffect(() => {
    // Fetch user data on component mount
    fetch("http://localhost:8080/me", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch user data");
        return response.json();
      })
      .then((data) => {
        const email = data?.users?.email;
        if (email) {
          setUserEmail(email);
          // Ensure the user's email is the first and only entry if not already present
          setFormData((prevData) => {
            const updatedStudents = prevData.students.includes(email) 
              ? prevData.students 
              : [email];
            
            return {
              ...prevData,
              students: updatedStudents
            };
          });
        }
      })
      .catch((error) => console.error("Error fetching user data:", error));

    // Fetch students
    fetch("http://localhost:8080/graduationstudents", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch students");
        return response.json();
      })
      .then((data) => {
        setStudents(data.students);
      })
      .catch((error) => console.error("Error fetching students:", error));
  }, []);


useEffect(() => {
  // Fetch teachers when component mounts
  fetch("http://localhost:8080/teachers", {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  })
    .then((response) => {
      if (!response.ok) throw new Error("Failed to fetch teachers");
      return response.json();
    })
    .then((data) => {
      setTeachers(data.teachers);
    })
    .catch((error) => console.error("Error fetching teachers:", error));
}, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: null,
    }));
  };

  const handleFileChange = (e) => {
    setFormData((prevData) => ({
      ...prevData,
      file: e.target.files[0],
    }));
  };

  const handleDynamicFieldChange = (field, index, value) => {
    setFormData((prevData) => {
      const currentField = prevData[field] || [];
      const updatedField = [...currentField];
      updatedField[index] = value;
      return { ...prevData, [field]: updatedField };
    });
  };

  const addDynamicField = (field) => {
    setFormData((prevData) => {
      const currentFields = prevData[field] || [];
      
      // Check if we've reached the maximum limit of 3
      if (currentFields.length >= 3) {
        return prevData; // Don't add more fields
      }
      
      return {
        ...prevData,
        [field]: [...currentFields, ""],
      };
    });
  };

  const removeDynamicField = (field, index) => {
    setFormData((prevData) => {
      const updatedField = [...prevData[field]];
      updatedField.splice(index, 1);
      return { ...prevData, [field]: updatedField };
    });
  };
  const validateForm = () => {
    let validationErrors = {};

    if (!formData.name) {
      validationErrors.name = "اسم المشروع مطلوب";
    } else if (formData.name.length < 3) {
      validationErrors.name = "يجب أن يكون اسم المشروع على الأقل 3 أحرف";
    } else if (formData.name.length > 150) {
      validationErrors.name = "يجب أن يكون اسم المشروع أقل من 150 حرف";
    }

    if (!formData.description) {
      validationErrors.description = "وصف المشروع مطلوب";
    } else if (formData.description.length < 10) {
      validationErrors.description = "يجب أن يكون وصف المشروع على الأقل 10 أحرف";
    } else if (formData.description.length > 1000) {
      validationErrors.description = "لا يمكن لوصف المشروع أن يكون أكثر من 1000 حرف";
    }

    if (!formData.year || !years.includes(parseInt(formData.year))) {
      validationErrors.year = "السنة مطلوبة";
    }

    if (!formData.season) {
      validationErrors.season = "الموسم مطلوب";
    } else if (!["spring", "fall"].includes(formData.season)) {
      validationErrors.season = "يجب اختيار موسم ربيع أو خريف";
    }

    if (formData.students.length === 0) {
      validationErrors.students = "يجب إضافة طالب واحد على الأقل";
    }
    if (!formData.advisors.some(advisor => advisor.trim() !== "")) {
      validationErrors.advisors = "يجب إضافة مشرف واحد على الأقل";
    }

    if (formData.file_description && formData.file_description.length > 1000) {
      validationErrors.file_description = "لا يمكن لوصف ملف المشروع أن يكون أكثر من 1000 حرف";
    }

    return validationErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "file" && value) data.append(key, value);
      else if (Array.isArray(value)) data.append(key, value.join(","));
      else data.append(key, value);
    });

    fetch("http://localhost:8080/preproject", {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: data,
    })
      .then(async (response) => {
        const errorData = await response.json();

        setIsSubmitting(false);
        if (!response.ok) {
          const backendErrors = {};
          if (
            errorData.error?.error === "Similar projects found" &&
            errorData.error?.similar_projects
          ) {
            backendErrors.message = "Project is too similar to existing projects. Please modify your project.";
            backendErrors.similarProjects = errorData.error.similar_projects;
          }
          if (errorData.error === "You already have an existing pre-project") {
            backendErrors.general = "لديك مشروع أولي موجود بالفعل.";
          }

          setErrors({ ...backendErrors });
          return Promise.reject(errorData);
        }

        refreshProjects();
        closeForm();
      })
      .catch((error) => {
        console.error("Error submitting project:", error);
        setErrors((prevErrors) => ({
          ...prevErrors,
          general: error.message || "حدث خطأ غير متوقع",
        }));
        setIsSubmitting(false);
      });
  };
  return (
    <div className="overlay-content">
      <h2>إضافة مشروع جديد</h2>
      <form onSubmit={handleSubmit}>
        {errors.general && <div className="error-message">{errors.general}</div>}
        {/* Form Fields */}
        <div className="form-grid">
          {/* First Column */}
          <div className="form-column">
            <div className="form-group">
              <label>اسم المشروع</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? "error-input" : ""}
                disabled={isSubmitting}
              />
              {errors.name && <div className="error-message">{errors.name}</div>}
            </div>

            <div className="form-group">
              <label>وصف المشروع</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className={errors.description ? "error-input" : ""}
                disabled={isSubmitting}
              />
              {errors.description && (
                <div className="error-message">{errors.description}</div>
              )}
            </div>

            <div className="form-group">
        <span>الطلاب</span>
        {formData.students.map((student, index) => (
  <div key={index} className="dynamic-field">
    {student === userEmail ? (
      <input
        type="text"
        value={student}
        disabled
      />
    ) : (
      <select
        value={student}
        onChange={(e) =>
          handleDynamicFieldChange("students", index, e.target.value)
        }
        disabled={isSubmitting}
      >
        <option value="">اختر طالب</option>
        {(students || [])
          .filter(
            (s) =>
              s?.email === student ||
              !(formData.students || []).includes(s?.email)
          )
          .map((s) => (
            <option key={s?.id} value={s?.email}>
              {s?.name || 'غير معروف'}
            </option>
          ))}
      </select>
    )}
    {student !== userEmail && (
      <button
        type="button"
        onClick={() => removeDynamicField("students", index)}
        disabled={isSubmitting}
      >
        حذف
      </button>
    )}
  </div>
))}
    <button
          type="button"
          onClick={() => addDynamicField("students")}
          disabled={
            isSubmitting || 
            (formData.students || []).length >= 3 || 
            (formData.students || []).filter(s => s !== userEmail).length >= 2
          }
        >
          إضافة طالب
        </button>
      </div>
          </div>
          <div className="form-column">
           

            {(formData.advisors || []).map((advisor, index) => (
              <div key={index} className="dynamic-field">
                <select
                  value={advisor || ""}
                  onChange={(e) => {
                    const selectedEmail = e.target.value;
                    handleDynamicFieldChange("advisors", index, selectedEmail);
                  }}
                  className={errors[`advisor_${index}`] ? "error-input" : ""}
                  disabled={isSubmitting}
                >
                  <option value="">اختر مشرف</option>
                  {(teachers || [])
                    .filter(
                      (teacher) =>
                        teacher.email === advisor ||
                        !formData.advisors.includes(teacher.email)
                    )
                    .map((teacher) => (
                      <option key={teacher.id} value={teacher.email}>
                        {teacher.name}
                      </option>
                    ))}
                </select>
                
                {(formData.advisors || []).length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDynamicField("advisors", index)}
                    disabled={isSubmitting}
                  >
                    حذف
                  </button>
                )}
                
                {errors[`advisor_${index}`] && (
                  <div className="error-message">
                    {errors[`advisor_${index}`]}
                  </div>
                )}
              </div>
            ))}
 {errors.advisors && <div className="error-message">{errors.advisors}</div>}
 <button
              type="button"
              onClick={() => addDynamicField("advisors")}
              disabled={
                isSubmitting ||
                !formData.advisors ||
                (formData.advisors?.length || 0) >= 3 || // Limit to 3 advisors
                (formData.advisors?.length || 0) >= (teachers?.length || 0)
              }
            >
              
              إضافة مشرف
            </button>

            <div className="form-row">
              <div className="form-group">
                <label>السنة</label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className={errors.year ? "error-input" : ""}
                  disabled={isSubmitting}
                >
                  <option value="">اختر سنة</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                {errors.year && <div className="error-message">{errors.year}</div>}
              </div>

              <div className="form-group">
                <label>الفصل</label>
                <select
                  name="season"
                  value={formData.season}
                  onChange={handleChange}
                  className={errors.season ? "error-input" : ""}
                  disabled={isSubmitting}
                >
                  <option value="">اختر فصل</option>
                  <option value="fall">الخريف</option>
                  <option value="spring">الربيع</option>
                </select>
                {errors.season && (
                  <div className="error-message">{errors.season}</div>
                )}
              </div>
            </div>
            <div className="form-group">
            {formData.file && (
    <div className="form-group">
      <span>وصف الملف</span>
      <input
        type="text"
        name="file_description"
        value={formData.file_description || ""}
        onChange={handleChange}
        placeholder="أدخل وصفًا للملف"
        disabled={isSubmitting}
      />
    </div>
  )}
              <label>
                ملف (اختياري)
                <div className="file-upload">
                  <span>{formData.file ? formData.file.name : "اختر ملف"}</span>

                  <input type="file" name="file" onChange={handleFileChange} />
                </div>
              </label>
            </div>

          </div>
       
        </div>

        <div className="form-actions">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "جاري الإضافة..." : "إضافة مشروع"}
          </button>
          <button type="button" onClick={closeForm} disabled={isSubmitting} className="cancel-button">
            إلغاء
          </button>
        </div>
        {errors.message === "Project is too similar to existing projects. Please modify your project." && (
  <div className="similar-projects-error">
    <div className="error-message">
      مشاريع مشابهة تم العثور عليها
    </div>
    <p style={{
      color: '#856404',
      marginBottom: '10px'
    }}>
      يرجى تعديل مشروعك لأنه يشبه المشاريع التالية:
    </p>
    <div className="similar-projects-list">
      {errors.similarProjects && errors.similarProjects.length > 0 ? (
        errors.similarProjects.slice(0, 3).map((project, index) => {
          const isPreProject = project.source_table === 'pre_project';

          return (
            <div 
              key={project.project_id || index} 
              className="similar-project-item"
            >
              <div style={{flex: 1}}>
                <div className="similar-project-item-title">
                  {project.project_name}
                </div>
                <p className="similar-project-item-description">
                  {project.project_description}
                </p>
                <div className="similar-project-item-similarity">
                  نسبة التشابه: {project.similarity_score}%
                </div>
                <div className="similar-project-item-type">
                  نوع المشروع: {isPreProject ? "مشروع أولي" : "مشروع نهائي"}
                </div>
              </div>
              <Link 
                to={isPreProject 
                  ? `/PreProjects/${project.project_id}` 
                  : `/projects/${project.project_id}`
                } 
                className="link-button"
              >
                عرض التفاصيل
              </Link>
            </div>
          );
        })
      ) : (
        <div>لا توجد تفاصيل للمشاريع المشابهة</div>
      )}
    </div>
  </div>
)}
      </form>
    </div>
  );
};
       

export default AddPreProjectForm;