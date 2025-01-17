import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import '../../style/login.css';
import FileUpload from '../fileupload'; // Import the FileUpload component

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [image, setImage] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (event) => {
    event.preventDefault();
  
    // Reset error and success messages
    setErrorMessage('');
    setSuccessMessage('');
  
    // Validate inputs
    if (!name || !email || !password) {
      setErrorMessage('جميع الحقول مطلوبة');
      return;
    }
  
    if (password.length < 6) {
      setErrorMessage('يجب أن تتكون كلمة المرور من 6 أحرف على الأقل');
      return;
    }
    try {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('password', password);
        if (image) {
          formData.append('image', image);
        }
    
        const response = await fetch('http://localhost:8080/signup', {
          method: 'POST',
          body: formData,
        });
    
        const data = await response.json();
    
        if (response.ok) {
          setSuccessMessage(
            data.message || 'تم إنشاء الحساب بنجاح. الرجاء التحقق من بريدك الإلكتروني.'
          );
          
          // Navigate to verify-email and pass email as state
          setTimeout(() => navigate('/verify-email', { 
            state: { email } 
          }), 2000);
        } else {
          setErrorMessage(
            (typeof data.error === 'string' ? data.error : 'حدث خطأ أثناء إنشاء الحساب')
          );
        }
      } catch (error) {
        setErrorMessage(
          error.message ? error.message : 'فشل الاتصال بالخادم'
        );
      }
    };

  const isError = !!errorMessage;

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <Mail className="mail-icon" size={32} />
          <h1>إنشاء حساب جديد</h1>
          <p>املأ التفاصيل أدناه لإنشاء حسابك</p>
        </div>

        <form onSubmit={handleSignup} className="login-form">
          <div className="form-group">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="الاسم"
              className={`input-field ${isError ? 'input-error' : ''}`}
            />
          </div>

          <div className="form-group">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="البريد الإلكتروني"
              className={`input-field ${isError ? 'input-error' : ''}`}
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور"
              className={`input-field ${isError ? 'input-error' : ''}`}
            />
          </div>

          {/* Use the FileUpload component with a prop to change the text */}
          <div className="form-group">
            <FileUpload file={image} onFileChange={setImage} label="اختر صورة" />
          </div>

          {errorMessage && (
            <div className="error-message">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="success-message">
              {successMessage}
            </div>
          )}

          <button type="submit" className="login-button">
            إنشاء حساب
          </button>
        </form>

        <div className="signup-prompt">
          <p>لديك حساب بالفعل؟ <span onClick={() => navigate('/login')} className="signup-link">تسجيل الدخول</span></p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
