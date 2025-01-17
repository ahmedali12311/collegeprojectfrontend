import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sparkles, FileText, Edit3, Trash2, Check, X } from 'lucide-react';
import EditProjectForm from './Add_EDIT_ProjectForms/editprojectform.js';
import '../../style/ProjectDetails.css';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`http://localhost:8080/book/${id}`);
  
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.status}`);
        }
  
        const data = await response.json();
  
        const updatedProject = {
          ...data.book, // Adjust to match API response
          file: data.book.file ? data.book.file.replace(/\\/g, '/') : null,
        };
        setProject(updatedProject);
      } catch (error) {
        console.error("Error fetching project:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchProject();
  }, [id]);
  

  const handleDelete = async () => {
    try {
      const response = await fetch(`http://localhost:8080/book/${id}`, { 
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      method: 'DELETE' });
      if (!response.ok) throw new Error('Network response was not ok');
      navigate('/Projects');
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const handleEditButtonClick = () => setShowEditForm(true);

  const handleUpdateProject = (updatedProject) => {
    setProject(updatedProject);
    window.location.reload();
  };

  const handleReadFile = () => {
    if (project.file) window.open(project.file, '_blank');
  };

  const translateSeason = (season) => {
    const translations = { fall: 'خريف', spring: 'ربيع' };
    return translations[season] || season;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Sparkles className="loading-icon" />
        <span>جاري التحميل...</span>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="project-detail-container" dir="rtl">
      <div className="project-header">
        <Sparkles className="header-icon" />
        <h2>تفاصيل المشروع</h2>
      </div>

      <div className="project-card">
        <div className="project-info">
          <div className="info-group">
            <label>العنوان</label>
            <p>{project.name}</p>
          </div>

          <div className="info-group">
            <label>الوصف</label>
            <p>{project.description}</p>
          </div>

          <div className="info-group">
            <label>الطلاب</label>
            <p>{project.students.map((student) => student.name).join(', ') || 'لا يوجد طلاب'}</p>
          </div>

          <div className="info-group">
            <label>المشرفين</label>
            <p>{project.advisors.map((advisor) => advisor.name).join(', ') || 'لا يوجد مشرفين'}</p>
          </div>

          <div className="info-group">
            <label>المناقشين</label>
            <p>{project.discutants.map((discussant) => discussant.name).join(', ') || 'لا يوجد مناقشين'}</p>
          </div>

          <div className="info-row">
            <div className="info-group">
              <label>السنة</label>
              <p>{project.year}</p>
            </div>

            <div className="info-group">
              <label>الفصل</label>
              <p>{translateSeason(project.season)}</p>
            </div>
          </div>
        </div>

        {project.file ? (
          <button className="file-button" onClick={handleReadFile}>
            <FileText className="button-icon" />
            <span>عرض الملف</span>
          </button>
        ) : (
          <p
            style={{
              textAlign: 'center',
              fontWeight: 'bold',
              backgroundColor: '#f8d7da',
              color: '#721c24',
              padding: '10px 20px',
              borderRadius: '5px',
              border: '1px solid #f5c6cb',
              margin: '20px 0',
            }}
          >
            لا يوجد ملف متاح!
          </p>
        )}

        <div className="action-buttons">
          <button className="edit-button" onClick={handleEditButtonClick}>
            <Edit3 className="button-icon" />
            <span>تعديل</span>
          </button>
          <button className="delete-buttons" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 className="button-icon" />
            <span>حذف</span>
          </button>
        </div>
      </div>

      {showEditForm && (
        <div className="modal-overlay">
          <EditProjectForm
            project={project}
            closeForm={() => setShowEditForm(false)}
            onUpdate={handleUpdateProject}
          />
        </div>
      )}

      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="delete-confirmation">
            <h3>هل أنت متأكد أنك تريد حذف هذا المشروع؟</h3>
            <div className="confirmation-buttons">
              <button className="confirm-yes" onClick={handleDelete}>
                <Check className="button-icon" />
                <span>نعم</span>
              </button>
              <button className="confirm-no" onClick={() => setShowDeleteConfirm(false)}>
                <X className="button-icon" />
                <span>لا</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
