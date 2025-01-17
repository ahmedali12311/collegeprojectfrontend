import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sparkles, FileText, Edit3, Trash2, Check, X } from 'lucide-react';
import EditPreProjectForm from './editpreprojectform';
import '../../style/ProjectDetails.css';
import { jwtDecode } from 'jwt-decode';

const PreProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false); // State to hold admin status
  const [userId, setUserId] = useState(null); // State to hold user ID
  const [canUpdate, setCanUpdate] = useState(project?.can_update || false);
  const [showTransferToBookOverlay, setShowTransferToBookOverlay] = useState(false);
  const [messageType, setMessageType] = useState('success');
  const [updating, setUpdating] = useState(false); // New loading state for update
  const [shadowMessage, setShadowMessage] = useState('');
  const [degree, setDegree] = useState('');
  const checkUserRole = () => {
    const token = localStorage.getItem("token");
    if (token) {
      const decodedToken = jwtDecode(token);
      setIsAdmin(decodedToken.user_role.includes("admin"));
      setUserId(decodedToken.id); // Set user ID from decoded token
    }
  };
 

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`http://localhost:8080/preproject/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        const mappedProject = {
          ...data.pre_project.pre_project,
          file: data.pre_project.pre_project.file
            ? data.pre_project.pre_project.file.replace(/\\/g, '/')
            : null,
            students: data.pre_project.students, // Keep the full student objects
            advisors: data.pre_project.advisors,
            accepted_advisor_info: data.pre_project.accepted_advisor_info,
        discussants: data.pre_project.discussants || [], // Assuming discussants are part of the response
 
        };
        setProject(mappedProject);
        setCanUpdate(mappedProject.can_update);

      } catch (error) {
        console.error('Error fetching project:', error);
      } finally {
        setLoading(false);
      }
    };


    fetchProject();
    checkUserRole(); // Check user role and set user ID

  }, [id]);


  const handleDeleteProject = async () => {
    if (!project.can_update) {
      alert('الحذف غير مسموح حاليًا');
      return;
    }
  
    try {
      const token = localStorage.getItem('token'); // Get the token from localStorage
      const response = await fetch(`http://localhost:8080/preproject/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`, // Include the Bearer token
        }
      });
  
      if (!response.ok) throw new Error('Network response was not ok');
      navigate('/PreProjects');
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };
  const handleEditButtonClick = () => {
    if (project.can_update) {
      setShowEditForm(true);
    } else {
      alert('التعديل غير مسموح حاليًا');
    }
  };  const handleAcceptProject = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/advisorresponse`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          pre_project_id: id,
          status: 'accepted'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to accept project');
      }

      // Optionally, you can add a success message or refresh the project data
      alert('تم قبول المشروع بنجاح');
      
      // Optionally reload the project details or navigate
      window.location.reload();
    } catch (error) {
      console.error('Error accepting project:', error);
      alert('حدث خطأ أثناء قبول المشروع');
    }
  };

  // New method to handle project rejection
  const handleRejectProject = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/advisorresponse`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          pre_project_id: id,
          status: 'rejected'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to reject project');
      }

      // Optionally, you can add a success message or refresh the project data
      alert('تم رفض المشروع بنجاح');
      
      // Optionally reload the project details or navigate
      window.location.reload();
    } catch (error) {
      console.error('Error rejecting project:', error);
      alert('حدث خطأ أثناء رفض المشروع');
    }
  };
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
 


  const handleUpdateStatusToggle = async () => {
    setUpdating(true); // Set updating to true when starting the update
    try {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('Can_update', String(!canUpdate));

        const response = await fetch(`http://localhost:8080/canupdate/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        if (response.ok) {
            setProject(prevProject => ({
                ...prevProject,
                can_update: !canUpdate,
            }));
            setCanUpdate(!canUpdate);

            // Update the message based on the new state
            if (!canUpdate) {
                setShadowMessage('تم تفعيل التحديث');
                setMessageType('success');
            } else {
                setShadowMessage('تم تعطيل التحديث');
                setMessageType('error'); 
            }
        } else {
            const errorMessage = 'حدث خطأ أثناء تغيير حالة التحديث';
            setShadowMessage(errorMessage);
            setMessageType('error');
        }
    } catch (error) {
        console.error('Error:', error.message);
        setShadowMessage(error.message || 'حدث خطأ غير متوقع');
        setMessageType('error');
    } finally {
        setUpdating(false); // Reset updating state when done
        setTimeout(() => {
            setShadowMessage('');
        }, 3000);
    }
};
const handleResetAdvisors = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:8080/preproject/${id}/reset-advisors`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to reset advisors');
    }

    // Optionally, you can reload the project details or show a success message
    alert('تم إعادة تعيين المشرفين بنجاح');
    
    // Reload the project details
    window.location.reload();
  } catch (error) {
    console.error('Error resetting advisors:', error);
    alert(error.message || 'حدث خطأ أثناء إعادة تعيين المشرفين');
  }
};


  const CustomSwitch = ({ checked, onChange }) => {
    return (
      <div 
        onClick={onChange}
        style={{
          width: '60px',
          height: '30px',
          backgroundColor: checked ? '#52c41a' : 'gray',
          borderRadius: '15px',
          position: 'relative',
          cursor: 'pointer',
          transition: 'background-color 0.3s'
        }}
      >
        <div 
          style={{
            width: '26px',
            height: '26px',
            backgroundColor: 'white',
            borderRadius: '50%',
            position: 'absolute',
            top: '2px',
            left: checked ? '32px' : '2px',
            transition: 'left 0.3s'
          }}
        />
      </div>
    );
  };
  if (!project) return null;
  const isAdvisor = project?.advisors.some((advisor) => advisor.advisor_id === userId);
  const hasAcceptedAdvisor = project?.accepted_advisor !== null;
  const isProjectOwner = project?.project_owner === userId;

  const handleTransferToBook = async () => {
    // Validate degree input
    if (!degree) {
      alert('يرجى إدخال الدرجة');
      return;
    }
    if(degree<=0){
      alert('يرجى إدخال درجة صحيحة');
      return;
    }
    if(degree>100){
      alert('يرجى إدخال درجة اقل من 100');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/transferbook/${id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          degree: degree // Send only the degree
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'فشل نقل المشروع إلى الكتب');
      }

      // Parse the response to get the new book ID
      const responseData = await response.json();
      const newBookId = responseData.book.id;

      // Success handling
      alert('تم نقل المشروع إلى الكتب بنجاح');
      navigate(`/Projects/${newBookId}`);
    } catch (error) {
      console.error('Error transferring project to book:', error);
      alert(error.message || 'حدث خطأ أثناء نقل المشروع');
    } finally {
      // Close the overlay
      setShowTransferToBookOverlay(false);
      setDegree(''); // Reset degree after transfer
    }
  };
  return (
    <div className="project-detail-container" dir="rtl">
      <div className="project-header">
        <Sparkles className="header-icon" />
        <h2>تفاصيل مقدمة المشروع</h2>
      </div>
      {(isAdmin) && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '15px 0'
                }}>
                    <label style={{ marginLeft: '10px' }}>حالة التحديث</label>
                    <CustomSwitch
                        checked={canUpdate}
                        onChange={handleUpdateStatusToggle}
                        disabled={updating} // Disable while updating
                    />
                    <span style={{ marginRight: '10px' }}>
                        {canUpdate ? 'مفعل' : 'معطل'}
                    </span>
                </div>
            )}
  {shadowMessage && (
        <div 
          className={`shadow-message shadow-message-${messageType}`}
        >
          {messageType === 'success' ? (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="shadow-message-icon"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          ) : (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="shadow-message-icon"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          )}
          {shadowMessage}
        </div>
      )}

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

        {/* New section for displaying students */}
        <div className="info-group">
  <label>الطلاب</label>
  {project.students.length > 0 ? (
    <ul className="students-list">
      {project.students.map((student) => (
        <li 
          key={student.student_id} 
          className="student-item"
        >
          {student.student_name}
        </li>
      ))}
    </ul>
  ) : (
    <p>لا يوجد طلاب مسجلين.</p>
  )}
      <div className="info-group">
  <label>المشرفين</label>
  {project.accepted_advisor_info ? (
    // If there's an accepted advisor, show their name
    <p>{project.accepted_advisor_info.name}</p>
  ) : project.advisors && project.advisors.length > 0 ? (
    // If there are advisors, show the list with their status
    <ul className="advisors-list">
      {project.advisors.map((advisor) => (
        <li 
          key={advisor.advisor_id} 
          className={`advisor-item ${
            advisor.status === 'pending' ? 'advisor-pending' : 
            advisor.status === 'rejected' ? 'advisor-rejected' : ''
          }`}
        >
          {advisor.advisor_name}{advisor.status !== 'accepted' && ` - ${advisor.status === 'pending' ? 'في الانتظار' : 'مرفوض'}`}
        </li>
      ))}
    </ul>
  ) : (
    // If no accepted advisor and no advisors, show "No advisors"
    <p 
      style={{
        color: '#6c757d', // Muted text color
        fontStyle: 'italic',
        backgroundColor: '#f8f9fa', // Light background
        padding: '10px',
        borderRadius: '5px',
        border: '1px solid #e9ecef'
      }}
    >
      لا يوجد مشرفين
    </p>
  )}
</div>
</div>
{project.discussants && project.discussants.length > 0 && (
  <div className="info-group">
    <label>المناقشون</label>
    <ul className="advisors-list">
      {project.discussants.map((discussant) => (
        <li key={discussant.discussant_id} className="advisor-item">
          {discussant.discussant_name}
        </li>
      ))}
    </ul>
  </div>
)}

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
        {project.file_description && (
  <div className="info-group">
    <label>وصف الملف</label>
    <p>{project.file_description}</p>
  </div>
)}
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
            backgroundColor: '#f8d7da', // Light red background
            color: '#721c24', // Dark red text
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
  {(isAdmin && project.accepted_advisor) && (
    <button 
      className="transfer-to-book-button"
      onClick={() => setShowTransferToBookOverlay(true)}
      style={{
        backgroundColor: '#17a2b8',
        color: 'white',
        padding: '10px 20px',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
      }}
    >
      <Sparkles className="button-icon" />
      نقل إلى الكتب
    </button>
  )}

  {/* Show Edit and Delete buttons only for the project owner or admins */}
  {(isProjectOwner && project.can_update) || isAdmin ? (
    <>
      <button className="edit-button" onClick={handleEditButtonClick}>
        <Edit3 className="button-icon" />
        <span>تعديل</span>
      </button>
      <button className="delete-buttons" onClick={() => setShowDeleteConfirm(true)}>
        <Trash2 className="button-icon" />
        <span>حذف</span>
      </button>
      {(isAdmin ) && project.advisors && project.advisors.length > 0 && (
        <button 
          className="reset-advisors-button"
          onClick={() => {
            // Optional: Add a confirmation dialog before resetting
            if (window.confirm('هل أنت متأكد من إعادة تعيين المشرفين؟')) {
              handleResetAdvisors();
            }
          }}
          style={{
            backgroundColor: '#ffc107', // Amber color
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginLeft: '10px'
          }}
        >
          إعادة تعيين المشرفين
        </button>
      )}
    </>
  ) : null}
  {!hasAcceptedAdvisor && isAdvisor && (
            <>
              <button
                className="accept-button"
                onClick={handleAcceptProject}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
              >
                <Check className="button-icon" />
                قبول
              </button>

              <button
                className="reject-button"
                onClick={handleRejectProject}
                style={{
                  backgroundColor: '#dc3545',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
              >
                <X className="button-icon" />
                رفض
              </button>
            </>
          )}
      </div>

</div>
{showTransferToBookOverlay && (
        <div className="modal-overlay">
          <div className="overlay-content">
            <div className="form-grid">
              <div className="form-column">
                <div className="form-group">
                  <span>الدرجة</span>
                  <input 
                    type="text" 
                    value={degree} 
                    onChange={(e) => setDegree(e.target.value)} 
                  />
                </div>
              </div>
            </div>

            <div className="confirmation-buttons">
              <button 
                className="confirm-yes"
                onClick={handleTransferToBook}
                disabled={!degree} // Disable if no degree
              >
                <Check className="button-icon" />
                <span>نقل</span>
              </button>
              <button 
                className="confirm-no"
                onClick={() => {
                  setShowTransferToBookOverlay(false);
                  setDegree(''); // Reset degree when closing
                }}
              >
                <X className="button-icon" />
                <span>إلغاء</span>
              </button>
            </div>
      
        
   
      </div>
    </div>
  )}

      {showEditForm && (
        <div className="modal-overlay">
          <EditPreProjectForm
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
              <button className="confirm-yes" onClick={handleDeleteProject}>
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

export default PreProjectDetail;
