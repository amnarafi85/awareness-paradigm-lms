import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';
import './login.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsRedirecting(true); // Start visual transition

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message);
      setIsRedirecting(false);
      return;
    }

    const userId = data.user.id;

    const { data: userInfo, error: userError } = await supabase
      .from('users')
      .select('role, is_blocked')
      .eq('id', userId)
      .single();

    if (userError || !userInfo) {
      await supabase.auth.signOut();
      setError('User info not found.');
      setIsRedirecting(false);
      return;
    }

    if (userInfo.is_blocked) {
      await supabase.auth.signOut();
      setError('Your account has been blocked by the admin.');
      setIsRedirecting(false);
      return;
    }

    const role = userInfo.role;

    const { error: updateError } = await supabase.auth.updateUser({
      data: { role },
    });

    if (updateError) {
      setError('Failed to update user metadata.');
      setIsRedirecting(false);
      return;
    }

    // Redirect to the correct dashboard
    if (role === 'admin') navigate('/admin-dashboard');
    else if (role === 'teacher') navigate('/teacher-dashboard');
    else if (role === 'student') navigate('/student-dashboard');
    else {
      setError('Unknown user role.');
      setIsRedirecting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="floating-circle large"></div>
      <div className="floating-circle medium"></div>
      <div className="floating-circle small"></div>

      <div className={`login-card ${isRedirecting ? 'login-card-loading' : ''}`}>
        <div className="login-header">
          <div className="login-icon">🧠</div>
          <h1 className="login-title">Awareness Paradigm</h1>
          <p className="login-subtitle">
            Transform your inner world through mindfulness
          </p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <input
            className="login-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isRedirecting}
          />
          <input
            className="login-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isRedirecting}
          />
          <button className="login-button" type="submit" disabled={isRedirecting}>
            {isRedirecting ? 'Redirecting...' : 'Begin Your Journey'}
          </button>
        </form>

        {error && <div className="login-error">{error}</div>}

        <div className="login-footer">
          Your journey to mindfulness starts here ✨
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
