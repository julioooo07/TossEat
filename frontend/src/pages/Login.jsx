import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Register.css';
import PasswordField from '../components/PasswordField';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const normalizedEmail = formData.email.trim();
    if (!normalizedEmail || !formData.password) {
      setError('Enter your email and password');
      setLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const result = await login(normalizedEmail, formData.password);
      
      if (result && result.success) {
        
        // Store user ID for preferences tracking
        const userId = result.user._id || result.user.email;
        localStorage.setItem('user_id', userId);

        // Admin accounts should always land on the admin dashboard.
        if (result.user.isAdmin) {
          navigate('/admin');
          return;
        }
        
        // Check if first login (no preferences stored)
        const hasPreferences = localStorage.getItem(`preferences_completed_${userId}`);
        
        if (!hasPreferences) {
          // First login - start chatbot
          navigate('/menu'); // Navigate to menu first
          // The chatbot will be triggered by FirstLoginHandler
        } else {
          // Not first login - go to the user dashboard
          navigate('/dashboard');
        }
      } else {
        setError(result?.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Login to Toss Eat</h2>
        
        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>
          
          <div className="form-group">
            <label>Password:</label>
            <PasswordField id="login-password" name="password" value={formData.password} onChange={handleChange} required autoComplete="current-password" placeholder="Enter your password" />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <p>
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
