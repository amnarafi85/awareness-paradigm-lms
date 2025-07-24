import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Check, AlertCircle, User, Mail, Lock, Users, Eye, EyeOff, Shield, Zap } from 'lucide-react';

const supabaseUrl = 'https://htcvvwvvlixmatxqpvyj.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0Y3Z2d3Z2bGl4bWF0eHFwdnlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjgzMDc1MSwiZXhwIjoyMDY4NDA2NzUxfQ.YjJQn4yjvAzzWy3ibYvUJXjP1yPCFgEeNWTI5OFE6oo';// ⛔ Replace with env in production
const supabase = createClient(supabaseUrl, serviceRoleKey);

const CreateUser = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: ''
  });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldFocus, setFieldFocus] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [formProgress, setFormProgress] = useState(0);

  // Calculate form completion progress
  useEffect(() => {
    const fields = Object.values(formData);
    const completed = fields.filter(field => field.trim() !== '').length;
    setFormProgress((completed / fields.length) * 100);
  }, [formData]);

  // Password strength calculation
  useEffect(() => {
    const password = formData.password;
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    setPasswordStrength(strength);
  }, [formData.password]);

  // Real-time validation
  const validateField = (name, value) => {
    const errors = { ...fieldErrors };
    
    switch (name) {
      case 'email':
        if (value && !/\S+@\S+\.\S+/.test(value)) {
          errors.email = 'Invalid email format';
        } else {
          delete errors.email;
        }
        break;
      case 'password':
        if (value && value.length < 6) {
          errors.password = 'Password must be at least 6 characters';
        } else {
          delete errors.password;
        }
        break;
      case 'fullName':
        if (value && value.trim().length < 2) {
          errors.fullName = 'Name must be at least 2 characters';
        } else {
          delete errors.fullName;
        }
        break;
      default:
        break;
    }
    
    setFieldErrors(errors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    validateField(name, value);
  };

  const handleFocus = (fieldName) => {
    setFieldFocus(prev => ({ ...prev, [fieldName]: true }));
  };

  const handleBlur = (fieldName) => {
    setFieldFocus(prev => ({ ...prev, [fieldName]: false }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);
    setIsSuccess(false);
    setIsError(false);

    try {
      const { data: user, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
      });

      if (authError) {
        console.error('Auth Error:', authError);
        setMessage(`Error: ${authError.message}`);
        setIsError(true);
        setIsLoading(false);
        return;
      }

      const { error: insertError } = await supabase
        .from('users')
        .insert([
          {
            id: user.user.id,
            email: formData.email,
            name: formData.fullName,
            role: formData.role,
          }
        ]);

      if (insertError) {
        console.error('Insert Error:', insertError);
        setMessage(`User created, but failed to add to DB: ${insertError.message}`);
        setIsError(true);
      } else {
        setMessage('User successfully created!');
        setIsSuccess(true);
        setTimeout(() => {
          setFormData({ email: '', password: '', fullName: '', role: '' });
          setPasswordStrength(0);
          setFormProgress(0);
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      setMessage('Unexpected error occurred.');
      setIsError(true);
    }

    setIsLoading(false);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return '#ef4444';
    if (passwordStrength < 50) return '#f97316';
    if (passwordStrength < 75) return '#eab308';
    return '#10b981';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return 'Weak';
    if (passwordStrength < 50) return 'Fair';
    if (passwordStrength < 75) return 'Good';
    return 'Strong';
  };

  return (
    <div className="create-user-wrapper">
      <div className="form-box">
        <div className="header">
          <div className="icon-wrapper">
            <User className="icon" />
            <div className="icon-pulse"></div>
          </div>
          <h2>Create New User</h2>
          <p>Add a new member to your platform</p>
          
          {formProgress > 0 && (
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${formProgress}%` }}
                ></div>
              </div>
              <span className="progress-text">{Math.round(formProgress)}% Complete</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className={`form ${isError ? 'shake' : ''} ${isSuccess ? 'pulse' : ''}`}>
          <div className={`input-group ${fieldFocus.email ? 'focused' : ''} ${fieldErrors.email ? 'error' : ''}`}>
            <Mail className="icon" />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              required
              value={formData.email}
              onChange={handleChange}
              onFocus={() => handleFocus('email')}
              onBlur={() => handleBlur('email')}
            />
            {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
          </div>

          <div className={`input-group password-group ${fieldFocus.password ? 'focused' : ''} ${fieldErrors.password ? 'error' : ''}`}>
            <Lock className="icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              required
              value={formData.password}
              onChange={handleChange}
              onFocus={() => handleFocus('password')}
              onBlur={() => handleBlur('password')}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
          </div>

          {formData.password && (
            <div className="password-strength">
              <div className="strength-bar">
                <div 
                  className="strength-fill" 
                  style={{ 
                    width: `${passwordStrength}%`,
                    background: getPasswordStrengthColor()
                  }}
                ></div>
              </div>
              <div className="strength-info">
                <Shield size={14} />
                <span style={{ color: getPasswordStrengthColor() }}>
                  {getPasswordStrengthText()}
                </span>
              </div>
            </div>
          )}

          <div className={`input-group ${fieldFocus.fullName ? 'focused' : ''} ${fieldErrors.fullName ? 'error' : ''}`}>
            <User className="icon" />
            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              required
              value={formData.fullName}
              onChange={handleChange}
              onFocus={() => handleFocus('fullName')}
              onBlur={() => handleBlur('fullName')}
            />
            {fieldErrors.fullName && <span className="field-error">{fieldErrors.fullName}</span>}
          </div>

          <div className={`input-group ${fieldFocus.role ? 'focused' : ''}`}>
            <Users className="icon" />
            <select
              name="role"
              required
              value={formData.role}
              onChange={handleChange}
              onFocus={() => handleFocus('role')}
              onBlur={() => handleBlur('role')}
            >
              <option value="">Select Role</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
            </select>
          </div>

          <button type="submit" disabled={isLoading || Object.keys(fieldErrors).length > 0} className="submit-btn">
            {isLoading ? (
              <div className="loading">
                <div className="spinner" />
                <span>Creating User...</span>
              </div>
            ) : isSuccess ? (
              <div className="success">
                <Check className="icon" />
                <span>User Created!</span>
              </div>
            ) : (
              <>
                <Zap className="btn-icon" />
                <span>Create User</span>
              </>
            )}
          </button>

          {message && (
            <div className={`message ${isSuccess ? 'success-msg' : 'error-msg'}`}>
              {isSuccess ? <Check className="icon" /> : <AlertCircle className="icon" />}
              <p>{message}</p>
            </div>
          )}
        </form>
      </div>

      {/* Enhanced CSS */}
      <style>{`
        .create-user-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          background-attachment: fixed;
          padding: 20px;
          font-family: 'Inter', 'Segoe UI', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .create-user-wrapper::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: float 20s linear infinite;
          pointer-events: none;
        }

        .form-box {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          box-shadow: 
            0 25px 50px rgba(0, 0, 0, 0.15),
            0 0 0 1px rgba(255, 255, 255, 0.1);
          max-width: 480px;
          width: 100%;
          padding: 40px;
          position: relative;
          z-index: 1;
          transform: translateY(0);
          transition: all 0.3s ease;
        }

        .form-box:hover {
          transform: translateY(-5px);
          box-shadow: 
            0 35px 70px rgba(0, 0, 0, 0.2),
            0 0 0 1px rgba(255, 255, 255, 0.1);
        }

        .header {
          text-align: center;
          margin-bottom: 35px;
        }

        .icon-wrapper {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .icon-wrapper:hover {
          transform: scale(1.1) rotate(5deg);
          box-shadow: 0 15px 35px rgba(102, 126, 234, 0.6);
        }

        .icon-wrapper .icon {
          color: white;
          z-index: 2;
          position: relative;
        }

        .icon-pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          transform: translate(-50%, -50%);
          animation: pulse-ring 2s ease-out infinite;
        }

        .header h2 {
          font-size: 28px;
          font-weight: 700;
          margin: 15px 0 8px;
          color: #1e293b;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .header p {
          color: #64748b;
          font-size: 16px;
          margin-bottom: 20px;
        }

        .progress-container {
          margin-top: 20px;
          text-align: center;
        }

        .progress-bar {
          width: 100%;
          height: 6px;
          background: #e2e8f0;
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
        }

        .form .input-group {
          position: relative;
          margin-bottom: 25px;
          transition: all 0.3s ease;
        }

        .input-group.focused {
          transform: translateY(-2px);
        }

        .input-group.error {
          animation: shake 0.4s ease;
        }

        .input-group .icon {
          position: absolute;
          left: 18px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          transition: all 0.3s ease;
          z-index: 1;
        }

        .input-group.focused .icon {
          color: #667eea;
          transform: translateY(-50%) scale(1.1);
        }

        .input-group input, .input-group select {
          width: calc(100% - 4px);
          box-sizing: border-box;
          padding: 16px 20px 16px 55px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          background: #f8fafc;
          transition: all 0.3s ease;
          font-size: 16px;
          color: #1e293b;
        }

        .input-group input:focus, .input-group select:focus {
          border-color: #667eea;
          background: #fff;
          outline: none;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .input-group input:hover, .input-group select:hover {
          border-color: #cbd5e1;
        }

        .password-group {
          position: relative;
        }

        .password-toggle {
          position: absolute;
          right: 15px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 5px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .password-toggle:hover {
          color: #667eea;
          background: rgba(102, 126, 234, 0.1);
        }

        .password-strength {
          margin-top: -15px;
          margin-bottom: 20px;
        }

        .strength-bar {
          width: 100%;
          height: 4px;
          background: #e2e8f0;
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .strength-fill {
          height: 100%;
          border-radius: 2px;
          transition: all 0.3s ease;
        }

        .strength-info {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 500;
        }

        .field-error {
          position: absolute;
          bottom: -20px;
          left: 18px;
          font-size: 12px;
          color: #ef4444;
          font-weight: 500;
        }

        .submit-btn {
          width: 100%;
          padding: 16px 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-weight: 600;
          font-size: 16px;
          border: none;
          border-radius: 12px;
          transition: all 0.3s ease;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          position: relative;
          overflow: hidden;
        }

        .submit-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: all 0.5s ease;
        }

        .submit-btn:hover::before {
          left: 100%;
        }

        .submit-btn:hover {
          background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
        }

        .submit-btn:active {
          transform: translateY(0);
        }

        .submit-btn:disabled {
          background: #cbd5e1;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .submit-btn:disabled::before {
          display: none;
        }

        .btn-icon {
          transition: all 0.3s ease;
        }

        .submit-btn:hover .btn-icon {
          transform: rotate(180deg);
        }

        .loading, .success {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .spinner {
          border: 3px solid rgba(255,255,255,0.3);
          border-top: 3px solid white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          animation: spin 1s linear infinite;
        }

        .message {
          margin-top: 25px;
          padding: 16px 20px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 500;
          animation: slideUp 0.3s ease;
        }

        .success-msg {
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
          color: #065f46;
          border: 2px solid #6ee7b7;
        }

        .error-msg {
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          color: #991b1b;
          border: 2px solid #f87171;
        }

        /* Animations */
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }

        @keyframes pulse-ring {
          0% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0;
          }
        }

        @keyframes float {
          0% { transform: translate(0, 0); }
          100% { transform: translate(-50px, -50px); }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .shake {
          animation: shake 0.4s ease;
        }

        .pulse {
          animation: pulse 0.6s ease;
        }

        /* Responsive Design */
        @media (max-width: 640px) {
          .create-user-wrapper {
            padding: 15px;
          }
          
          .form-box {
            padding: 30px 25px;
          }
          
          .header h2 {
            font-size: 24px;
          }
          
          .input-group input, .input-group select {
            padding: 14px 18px 14px 50px;
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default CreateUser;