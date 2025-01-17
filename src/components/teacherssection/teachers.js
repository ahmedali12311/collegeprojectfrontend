import React, { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight,Mail, X, Plus,  } from 'lucide-react';
import "../../style/teachers.css";
import {jwtDecode} from "jwt-decode";
import { Link } from 'react-router-dom';

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(6);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState("");
  const [roleId] = useState("2");
  const [submissionError, setSubmissionError] = useState(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [showRevokeConfirmation, setShowRevokeConfirmation] = useState(false);
const [userToRevoke, setUserToRevoke] = useState(null);

      const token=localStorage.getItem("token");

  useEffect(() => {
    const fetchTeachers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`http://localhost:8080/teachers`);
        if (!response.ok) throw new Error("فشل في جلب المعلمين");
        const data = await response.json();
        setTeachers(data.teachers || []);
        setFilteredTeachers(data.teachers || []);
        setTotalPages(Math.ceil((data.teachers || []).length / perPage)); // Ensure totalPages is calculated based on perPage
      } catch (err) {
        setError(err.message);
        setTeachers([]);
        setFilteredTeachers([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTeachers();
  }, [perPage]); // Add perPage to the dependency array

  useEffect(() => {
    if (searchQuery) {
      const filtered = teachers.filter(teacher =>
        teacher.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTeachers(filtered);
      setTotalPages(Math.ceil(filtered.length / perPage)); // Ensure totalPages is calculated based on perPage
      setCurrentPage(1); // Reset to first page on search
    } else {
      setFilteredTeachers(teachers);
      setTotalPages(Math.ceil(teachers.length / perPage)); // Ensure totalPages is calculated based on perPage
    }
  }, [searchQuery, teachers, perPage]); // Add perPage to the dependency array

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setIsAdmin(decodedToken.user_role?.includes("admin") || false);
      } catch (err) {
        console.error("فشل في فك تشفير الرمز:", err);
      }
    }
  }, []);

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    setSubmissionError(null);
    setSubmissionSuccess(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setSubmissionError("يرجى تسجيل الدخول مرة أخرى");
      setTimeout(() => {
        setSubmissionError(null);
      }, 3000); // Clear error after 3 seconds
      return;
    }

    try {
      const userResponse = await fetch(`http://localhost:8080/users?q=${email}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!userResponse.ok) throw new Error("فشل في جلب المستخدم");
      const userData = await userResponse.json();
      
      if (!userData.users?.length) throw new Error("المستخدم غير موجود");

      const formData = new URLSearchParams();
      formData.append('user_id', userData.users[0].id);
      formData.append('role_id', roleId);

      const roleResponse = await fetch(`http://localhost:8080/roles/grant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Bearer ${token}`
        },
        body: formData.toString(),
      });

      if (!roleResponse.ok) {
        const data = await roleResponse.json();
        throw new Error(data.error);
      }

      setSubmissionSuccess("تم إضافة المعلم بنجاح");
      setIsOverlayOpen(false);
      setEmail("");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSubmissionSuccess(null);
      }, 3000);

      // Fetch updated list of teachers
      const response = await fetch(`http://localhost:8080/teachers`);
      if (!response.ok) throw new Error("فشل في جلب المعلمين");
      const data = await response.json();
      setTeachers(data.teachers || []);
      setFilteredTeachers(data.teachers || []);
      setTotalPages(Math.ceil((data.teachers || []).length / perPage)); // Ensure totalPages is calculated based on perPage

    } catch (err) {
      setSubmissionError(err.message);
      setTimeout(() => {
        setSubmissionError(null);
      }, 3000); // Clear error after 3 seconds
    }
};
  const handleRevokeRole = async (userId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setSubmissionError("يرجى تسجيل الدخول مرة أخرى");
      return;
    }
  
    try {
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('role_id', '2');
  
      const response = await fetch(`http://localhost:8080/roles/revoke`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData
      });
  
      // Check if the response is not ok
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "فشل سحب الدور");
      }

  
      // Refresh teachers list
      const teachersResponse = await fetch(`http://localhost:8080/teachers`);
      if (!teachersResponse.ok) throw new Error("فشل في جلب المعلمين");
      const teachersData = await teachersResponse.json();
      
      setTeachers(teachersData.teachers || []);
      setFilteredTeachers(teachersData.teachers || []);
      setTotalPages(Math.ceil((teachersData.teachers || []).length / perPage));
  
      // Success message with a timeout to auto-dismiss
      setSubmissionSuccess("تم سحب دور المعلم بنجاح");
      
      // Auto-dismiss the success message after 3 seconds
      setTimeout(() => {
        setSubmissionSuccess(null);
      }, 3000);
  
    } catch (err) {
      console.error("Full error details:", err);
      
      // More detailed error logging
      const errorMessage = err.message || "حدث خطأ غير متوقع";
      console.error("Error revoking role:", errorMessage);
      
      setSubmissionError(errorMessage);
      
      // Auto-dismiss the error message after 3 seconds
      setTimeout(() => {
        setSubmissionError(null);
      }, 3000);
    }
  };
  
  

  const currentTeachers = filteredTeachers.slice((currentPage - 1) * perPage, currentPage * perPage);
  return (
    <div className="page-container">
      {isAdmin && (
        <button className="add-teacher-button" onClick={() => setIsOverlayOpen(true)}>
          <Plus size={20} /> إضافة معلم
        </button>
      )}

      <div className="dashboard-layout">
        <aside className="sidebar">
          <div className="sidebar-header">
            <h1>كلية تقنية المعلومات</h1>
            <p className="member-count">{filteredTeachers.length} أعضاء</p>
          </div>

          <div className="search-container">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="بحث عن أعضاء الهيئة التدريسية..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

       
        </aside>

        <main className="main-content">
          {isLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>جاري تحميل أعضاء الهيئة التدريسية...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>{error}</p>
              <button onClick={() => setCurrentPage(1)} className="add-teacher-button">حاول مرة أخرى</button>
            </div>
          ) : (
            <>
              <div className="teachers-grid">
                {currentTeachers.map((teacher) => (
                  <div key={teacher.id} className="teacher-card">
                    <div className="card-header">
                      <img
                        src={teacher.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.name)}&background=0D8ABC&color=fff`}
                        alt={teacher.name}
                      />
                      <span className="status-badge" />
                    </div>

                    <div className="card-body">
                      <h2>{teacher.name}</h2>
                      <p className="role">{teacher.email || 'تكنولوجيا المعلومات'}</p>

                     

                   

                      <div className="card-actions">
                      {showRevokeConfirmation && (
  <div className="modal-overlay">
    <div className="modal">
      <h2>تأكيد سحب الدور</h2>
      <p>هل أنت متأكد من رغبتك في سحب دور المعلم؟</p>
      <div className="confirmation-buttons">
        <button 
          onClick={() => {
            handleRevokeRole(userToRevoke);
            setShowRevokeConfirmation(false);
          }}
          className="confirm-button"
        >
          نعم، سحب الدور
        </button>
        <button 
          onClick={() => {
            setShowRevokeConfirmation(false);
            setUserToRevoke(null);
          }}
          className="cancel-button"
        >
          إلغاء
        </button>
      </div>
    </div>
  </div>
)}


 {token &&
  <button className="contact-button">
    
    <Link 
  to="/chat" 
  state={{ receiverEmail: teacher.email }} // Pass the teacher's email
  className="link-container"
>
  <Mail /> تواصل
</Link>
  </button>
 }
</div>
{isAdmin && (

<button 
  className="revoke-role-button"
  onClick={() => {
    setUserToRevoke(teacher.id);
    setShowRevokeConfirmation(true);
  }}
>

  سحب الدور
</button>
                       )};
       </div>
                  </div>
                ))}
                
              </div>

              {(submissionSuccess || submissionError) && (
  <div 
    className={`notification ${submissionSuccess ? 'success' : 'error'}`}
    style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: submissionSuccess ? '#28a745' : '#dc3545',
      color: 'white',
      padding: '10px 20px',
      borderRadius: '5px',
      zIndex: 1000,
      textAlign: 'center'
    }}
  >
    {submissionSuccess || submissionError}
  </div>
)}
              {filteredTeachers.length > 0 && (
                <div className="pagination">
                  <button
                    className="page-button"
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft />
                  </button>
                  <span>الصفحة {currentPage} من {totalPages}</span>
                  <button
                    className="page-button"
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight />
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {isOverlayOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <button className="close-button" onClick={() => setIsOverlayOpen(false)}>
              <X />
            </button>
            <h2>إضافة معلم جديد</h2>
            <form onSubmit={handleAddTeacher}>
              <div className="form-group">
                <label htmlFor="email">عنوان البريد الإلكتروني</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="أدخل بريد المعلم الإلكتروني"
                  required
                />
              </div>

              {submissionError && <p className="error-message">{submissionError}</p>}
              {submissionSuccess && <p className="success-message">{submissionSuccess}</p>}

              <div className="form-actions">
                <button type="submit" className="submit-button">إضافة</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teachers;
