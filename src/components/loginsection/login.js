import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import '../../style/login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedCredentials = localStorage.getItem('credentials');
    if (storedCredentials) {
      const { email, password } = JSON.parse(storedCredentials);
      setEmail(email);
      setPassword(password);
    }
  }, []);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return 'البريد الإلكتروني مطلوب';
    }
    if (!emailRegex.test(email)) {
      return 'يرجى إدخال بريد إلكتروني صالح';
    }
    return '';
  };

  const validatePassword = (password) => {
    if (!password) {
      return 'كلمة المرور مطلوبة';
    }
    if (password.length < 6) {
      return 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل';
    }
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Reset error message
    setErrorMessage('');

    const emailErrorMessage = validateEmail(email);
    const passwordErrorMessage = validatePassword(password);

    // If there are any errors, set the error message
    if (emailErrorMessage || passwordErrorMessage) {
      setErrorMessage(emailErrorMessage || passwordErrorMessage);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);

      const response = await fetch('http://localhost:8080/login', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        if (rememberMe) {
          localStorage.setItem('credentials', JSON.stringify({ email, password }));
        }
        const token = data.token;
        if (token) {
          localStorage.setItem('token', token);
        }
        navigate('/');
      } else {
        setErrorMessage(data.error || 'بيانات الاعتماد غير صحيحة');
      }
    } catch (error) {
      setErrorMessage('فشل الاتصال بالخادم');
    }
  };

  const isError = !!errorMessage; // Check if there is any error message

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <Mail className="mail-icon" size={32} />
          <h1>مرحبًا بعودتك</h1>
          <p>أدخل بيانات الاعتماد الخاصة بك للوصول إلى حسابك</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
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

          {/* Error message displayed below both fields */}
          {errorMessage && (
            <div className="error-message">
              {errorMessage}
            </div>
          )}

          <div className="form-options">
            <label className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>تذكرني</span>
            </label>
          </div>

          <button type="submit" className="login-button">
            تسجيل الدخول
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;