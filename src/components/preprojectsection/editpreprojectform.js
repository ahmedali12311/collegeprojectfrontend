import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const EditPreProjectForm = ({ project, closeForm, onUpdate }) => {
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear + 1];
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getProjectDetail = (key, defaultValue = '') => {
    if (project?.pre_project?.pre_project?.[key] !== undefined) {
      return project.pre_project.pre_project[key];
    }
    if (project?.pre_project?.[key] !== undefined) {
      return project.pre_project[key];
    }
    if (project?.[key] !== undefined) {
      return project[key];
    }
    return defaultValue;
  };

  const parseAdvisors = (advisors) => {
    if (!advisors) return [];
    const advisorList = project.pre_project ? project.pre_project.advisors : advisors;
    if (Array.isArray(advisorList)) {
      return advisorList.map(advisor => advisor.advisor_email || advisor.email || '');
    }
    return [];
  };

  const parseStudents = (students) => {
    if (!students) return [];
    const studentList = project.pre_project ? project.pre_project.students : students;
    const projectOwnerId = getProjectDetail('project_owner');

    if (Array.isArray(studentList)) {
      return studentList.map(student => ({
        email: student.student_email || student.email || '',
        isProjectOwner: student.student_id === projectOwnerId || student.id === projectOwnerId
      }));
    }
    return [];
  };

  const parseDiscutants = (discussants) => {
    if (!discussants) return [];
    const discutantList = project.pre_project ? project.pre_project.discussants : discussants;
    if (Array.isArray(discutantList)) {
      return discutantList.map(discutant => discutant.discussant_email || '');
    }
    return [];
  };

  const [formData, setFormData] = useState({
    name: getProjectDetail('name'),
    description: getProjectDetail('description'),
    students: parseStudents(project.students),
    advisors: parseAdvisors(project.advisors),
    discutants: parseDiscutants(project.discussants || []),
    year: getProjectDetail('year'),
    season: getProjectDetail('season'),
    file: null,
    file_name: getProjectDetail('file') ? getProjectDetail('file').split('/').pop() : '',
    file_description: getProjectDetail('file_description', ''),
    degree: getProjectDetail('degree', '')
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      setIsAdmin(decodedToken.user_role.includes('admin'));
    }
  }, []);

  useEffect(() => {
    fetch("http://localhost:8080/graduationstudents", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch students");
        return response.json();
      })
      .then((data) => setStudents(data.students))
      .catch((error) => console.error("Error fetching students:", error));
  }, []);

  useEffect(() => {
    fetch("http://localhost:8080/teachers", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch teachers");
        return response.json();
      })
      .then((data) => setTeachers(data.teachers))
      .catch((error) => console.error("Error fetching teachers:", error));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
    setErrors(prevErrors => ({
      ...prevErrors,
      [name]: null,
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prevData => ({
      ...prevData,
      file: e.target.files[0],
    }));
  };

  const handleDynamicFieldChange = (field, index, value) => {
    setFormData(prevData => {
      const updatedField = [...prevData[field]];
      updatedField[index] = value;
      return { ...prevData, [field]: updatedField };
    });
  };

  const addDynamicField = (field) => {
    setFormData(prevData => ({
      ...prevData,
      [field]: [...prevData[field], ""],
    }));
  };

  const removeDynamicField = (field, index) => {
    if (field === 'students') {
      const studentToRemove = formData.students[index];
      if (studentToRemove.isProjectOwner) return;
    }

    setFormData(prevData => {
      const updatedField = [...prevData[field]];
      updatedField.splice(index, 1);
      return { ...prevData, [field]: updatedField };
    });
  };

  const renderDiscutantsField = () => {
    if (!isAdmin) return null;
    return (
      <div className={`form-group ${errors.discutants ? "error-label" : ""}`}>
        <span>المناقشون</span>
        {formData.discutants.map((discutant, index) => (
          <div key={index} className="dynamic-field">
            <select
              value={discutant}
              onChange={(e) => handleDynamicFieldChange("discutants", index, e.target.value)}
              className={errors.discutants ? "error-input" : ""}
              disabled={isSubmitting}
            >
              <option value="">اختر مناقش</option>
              {teachers
  .filter(teacher => 
    teacher.email === discutant || 
    (!formData.discutants.includes(teacher.email) && 
     !formData.advisors.includes(teacher.email))
  )
  .map((teacher) => (
    <option key={teacher.id} value={teacher.email}>
      {teacher.name}
    </option>
  ))}
            </select>
            <button
              type="button"
              onClick={() => removeDynamicField("discutants", index)}
              disabled={isSubmitting}
            >
              حذف
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addDynamicField("discutants")}
          disabled={isSubmitting}
        >
          إضافة مناقش
        </button>
        {errors.discutants && <div className="error-message">{errors.discutants}</div>}
      </div>
    );
  };

  const renderDegreeField = () => {
    if (!isAdmin) return null;
    return (
      <div className={`form-group ${errors.degree ? "error-label" : ""}`}>
        <span>الدرجة</span>
        <input
          type="number"
          name="degree"
          value={formData.degree}
          onChange={handleChange}
          min="0"
          max="100"
          className={errors.degree ? "error-input" : ""}
          disabled={isSubmitting}
        />
        {errors.degree && <div className="error-message">{errors.degree}</div>}
      </div>
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    let validationErrors = {};

    // Name validation
    if (!formData.name) {
      validationErrors.name = "اسم المشروع مطلوب";
    } else if (formData.name.length < 3) {
      validationErrors.name = "يجب أن يكون اسم المشروع على الأقل 3 أحرف";
    } else if (formData.name.length > 150) {
      validationErrors.name = "يجب أن يكون اسم المشروع أقل من 150 حرف";
    }

    // Description validation
    if (!formData.description) {
      validationErrors.description = "وصف المشروع مطلوب";
    } else if (formData.description.length < 10) {
      validationErrors.description = "يجب أن يكون وصف المشروع على الأقل 10 أحرف";
    } else if (formData.description.length > 1000) {
      validationErrors.description = "لا يمكن لوصف المشروع أن يكون أكثر من 1000 حرف";
    }

    // Year validation
    if (!formData.year || formData.year <= 0) {
      validationErrors.year = "السنة مطلوبة";
    }

    // Season validation
    if (!formData.season) {
      validationErrors.season = "الموسم مطلوب";
    }

    // Degree validation (only for admin)
    if (isAdmin && formData.degree !== '') {
      const degreeNum = Number(formData.degree);
      if (isNaN(degreeNum) || degreeNum < 0 || degreeNum > 100) {
        validationErrors.degree = "الدرجة يجب أن تكون بين 0 و 100";
      }
    }
    if (formData.degree !== '') {
   
      if (formData.degree <= 0) {
        validationErrors.degree = "الدرجة قبل ان تكون موجبة أو أكبر من ال 0";
      }
      if (formData.degree > 100) {
        validationErrors.degree = "الدرجة يجب ان تكون اقل من 100 درجة";
      }
    }
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    const data = new FormData();
    
    if (!hasAcceptedAdvisor && !isAdmin) {
      data.append("name", formData.name);
      data.append("description", formData.description);
      data.append("year", formData.year);
      data.append("season", formData.season);
      data.append("students", formData.students.map(s => s.email).join(","));
      data.append("advisors", formData.advisors.join(","));
    }

    if (isAdmin) {
      data.append("discutants", formData.discutants.join(","));
      data.append("degree", formData.degree);
      
    }

    if (formData.file) {
      data.append("file", formData.file);
    } else {
      data.append("keep_existing_file", "true");
    }

    if (formData.file_description) {
      data.append("file_description", formData.file_description);
    }

    fetch(`http://localhost:8080/preproject/${project.id}`, {
      method: "PUT",
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: data
    })
      .then(async (response) => {
        const errorData = await response.json();
        setIsSubmitting(false);

        if (!response.ok) {
          if (errorData.error?.error === "Similar projects found" && 
              errorData.error?.similar_projects) {
            setErrors({
              message: "Project is too similar to existing projects. Please modify your project.",
              similarProjects: errorData.error.similar_projects
            });
            return Promise.reject(errorData);
          }

          const backendErrors = {};
          if (errorData.errors) {
            Object.keys(errorData.errors).forEach(key => {
              backendErrors[key] = errorData.errors[key];
            });
          }

          setErrors({
            ...backendErrors,
            general: errorData.error?.message || "حدث خطأ غير متوقع"
          });

          return Promise.reject(errorData);
        }

        return errorData;
      })
      .then((updatedProject) => {
        onUpdate(updatedProject.pre_project);
        closeForm();
      })
      .catch((error) => {
        console.error("Error updating project:", error);
        setIsSubmitting(false);
      });
  };

  const hasAcceptedAdvisor = getProjectDetail('accepted_advisor') !== null && 
                            getProjectDetail('accepted_advisor') !== '';

  const renderStudentsField = () => {
    return (
      <div className={`form-group ${errors.students ? "error-label" : ""}`}>
        <span>الطلاب</span>
        {formData.students.map((student, index) => (
          <div key={index} className="dynamic-field">
            {student.isProjectOwner ? (
              <input
                type="text"
                value={student.email}
                disabled
              />
            ) : (
              <select
                value={student.email}
                onChange={(e) => handleDynamicFieldChange("students", index, {
                  ...student,
                  email: e.target.value
                })}
                className={errors.students ? "error-input" : ""}
                disabled={isSubmitting}
              >
                <option value="">اختر طالب</option>
                {students
                  .filter(s => 
                    s?.email === student.email ||
                    !formData.students.some(fs => fs.email === s?.email)
                  )
                  .map((s) => (
                    <option key={s?.id} value={s?.email}>
                      {s?.name || 'غير معروف'}
                    </option>
                  ))}
              </select>
            )}
            {!student.isProjectOwner && (
              <button
                type="button"
                onClick={() => removeDynamicField("students", index)}
                disabled={isSubmitting}
              >
                حذف
              </button>
            )}
            {student.isProjectOwner && (
              <span className="project-owner-label">(مالك المشروع)</span>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => addDynamicField("students")}
          disabled={isSubmitting || formData.students.length >= 3}
        >
          إضافة طالب
        </button>
        {errors.students && <div className="error-message">{errors.students}</div>}
      </div>
    );
  };
  return (
    <div className="overlay-content">
      <h2>تعديل المشروع</h2>
      <form onSubmit={handleSubmit}>
        {errors.general && <div className="error-message">{errors.general}</div>}
  
        <div className="form-grid">
          <div className="form-column">
            {(!hasAcceptedAdvisor || isAdmin) && ( // Show if project is not accepted by advisor or if user is admin
              <>
                <div className={`form-group ${errors.name ? "error-label" : ""}`}>
                  <span>اسم المشروع</span>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={errors.name ? "error-input" : ""}
                    disabled={isSubmitting } 
                  />
                  {errors.name && <div className="error-message">{errors.name}</div>}
                </div>
  
                <div className={`form-group ${errors.description ? "error-label" : ""}`}>
                  <span>وصف المشروع</span>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className={errors.description ? "error-input" : ""}
                    disabled={isSubmitting } // disable if advisor has accepted
                  />
                  {errors.description && <div className="error-message">{errors.description}</div>}
                </div>
  
                {renderStudentsField()} {/* Render student-related field here */}
              </>
            )}
          </div>
  
          <div className="form-column">
            {(!hasAcceptedAdvisor || isAdmin) && ( // Same condition for showing advisor-related fields
              <>
                <div className={`form-group ${errors.advisors ? "error-label" : ""}`}>
                  <span>المشرفون</span>
                  {formData.advisors.map((advisor, index) => (
                    <div key={index} className="dynamic-field">
                      <select
                        value={advisor}
                        onChange={(e) => handleDynamicFieldChange("advisors", index, e.target.value)}
                        className={errors.advisors ? "error-input" : ""}
                        disabled={isSubmitting } // disable if advisor has accepted
                      >
                        <option value="">اختر مشرف</option>
                        {teachers
                          .filter(teacher => 
                            teacher.email === advisor || 
                            !formData.advisors.includes(teacher.email)
                          )
                          .map((teacher) => (
                            <option key={teacher.id} value={teacher.email}>
                              {teacher.name}
                            </option>
                          ))}
                      </select>
                      {formData.advisors.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeDynamicField("advisors", index)}
                          disabled={isSubmitting} // disable if advisor has accepted
                        >
                          حذف
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addDynamicField("advisors")}
                    disabled={isSubmitting  || formData.advisors.length >= 3} // limit advisors to 3
                  >
                    إضافة مشرف
                  </button>
                  {errors.advisors && <div className="error-message">{errors.advisors}</div>}
                </div>
  
                {renderDiscutantsField()}
                {renderDegreeField()}
  
                <div className="form-row">
                  <div className={`form-group ${errors.year ? "error-label" : ""}`}>
                    <span>السنة</span>
                    <select
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      className={errors.year ? "error-input" : ""}
                      disabled={isSubmitting} // disable if advisor has accepted
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
  
                  <div className={`form-group ${errors.season ? "error-label" : ""}`}>
                    <span>الفصل</span>
                    <select
                      name="season"
                      value={formData.season}
                      onChange={handleChange}
                      className={errors.season ? "error-input" : ""}
                      disabled={isSubmitting } // disable if advisor has accepted
                    >
                      <option value="">اختر فصل</option>
                      <option value="spring">ربيع</option>
                      <option value="fall">خريف</option>
                    </select>
                    {errors.season && <div className="error-message">{errors.season}</div>}
                  </div>
                </div>
              </>
            )}
  
            <div className="form-group">
              {(formData.file || getProjectDetail('file')) && (
                <div className="form-group">
                  <span>وصف الملف</span>
                  <input
                    type="text"
                    name="file_description"
                    value={formData.file_description}
                    onChange={handleChange}
                    placeholder="أدخل وصفًا للملف"
                    disabled={isSubmitting}
                  />
                </div>
              )}
              <label>
                ملف (اختياري)
                <div className="file-upload">
                  <span>
                    {formData.file 
                      ? formData.file.name 
                      : formData.file_name 
                      ? formData.file_name 
                      : "اختر ملف"}
                  </span>
                  <input 
                    type="file" 
                    name="file" 
                    onChange={handleFileChange} 
                  />
                </div>
              </label>
            </div>
          </div>
        </div>
  
        <div className="form-actions">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "جاري التعديل..." : "إرسال التعديل"}
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
  
}  
export default EditPreProjectForm;