import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    // Step 1: Login with Supabase Auth
    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message);
      return;
    }

    const userId = data.user.id;

    // Step 2: Fetch role from `users` table
    const { data: userInfo, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (roleError) {
      setError('Role not found for user');
      return;
    }

    const role = userInfo.role;

    // Step 3: Redirect based on role
    if (role === 'admin') navigate('/admin-dashboard');
    else if (role === 'teacher') navigate('/teacher-dashboard');
    else if (role === 'student') navigate('/student-dashboard');
    else setError('Unknown user role.');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background Elements */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '100px',
        height: '100px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '50%',
        animation: 'float 6s ease-in-out infinite'
      }}></div>
      <div style={{
        position: 'absolute',
        top: '70%',
        right: '15%',
        width: '150px',
        height: '150px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '50%',
        animation: 'float 8s ease-in-out infinite reverse'
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '20%',
        left: '20%',
        width: '80px',
        height: '80px',
        background: 'rgba(255, 255, 255, 0.08)',
        borderRadius: '50%',
        animation: 'float 7s ease-in-out infinite'
      }}></div>

      {/* Main Content */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '50px 40px',
        maxWidth: '450px',
        width: '90%',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.2)',
        animation: 'slideUp 1s ease-out',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            borderRadius: '50%',
            margin: '0 auto 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse 2s infinite',
            boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
          }}>
            <span style={{
              fontSize: '32px',
              color: 'white',
              fontWeight: 'bold'
            }}>🧠</span>
          </div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '10px',
            animation: 'fadeInDown 1s ease-out 0.3s both'
          }}>
            Awareness Paradigm
          </h1>
          <p style={{
            color: '#666',
            fontSize: '16px',
            animation: 'fadeInUp 1s ease-out 0.5s both'
          }}>
            Transform your inner world through mindfulness
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{
          animation: 'fadeIn 1s ease-out 0.7s both'
        }}>
          <div style={{ marginBottom: '25px' }}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '15px 20px',
                border: '2px solid #e1e5e9',
                borderRadius: '12px',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.3s ease',
                background: 'rgba(255, 255, 255, 0.8)',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e1e5e9';
                e.target.style.boxShadow = 'none';
                e.target.style.transform = 'translateY(0)';
              }}
            />
          </div>
          
          <div style={{ marginBottom: '30px' }}>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '15px 20px',
                border: '2px solid #e1e5e9',
                borderRadius: '12px',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.3s ease',
                background: 'rgba(255, 255, 255, 0.8)',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e1e5e9';
                e.target.style.boxShadow = 'none';
                e.target.style.transform = 'translateY(0)';
              }}
            />
          </div>

          <button 
            type="submit" 
            style={{
              width: '100%',
              padding: '15px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-3px)';
              e.target.style.boxShadow = '0 15px 40px rgba(102, 126, 234, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.3)';
            }}
          >
            Begin Your Journey
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: 'rgba(255, 107, 107, 0.1)',
            border: '1px solid rgba(255, 107, 107, 0.3)',
            borderRadius: '10px',
            color: '#e74c3c',
            textAlign: 'center',
            animation: 'shake 0.5s ease-in-out'
          }}>
            {error}
          </div>
        )}

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '30px',
          color: '#888',
          fontSize: '14px',
          animation: 'fadeIn 1s ease-out 1s both'
        }}>
          Your journey to mindfulness starts here ✨
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}

export default LoginPag