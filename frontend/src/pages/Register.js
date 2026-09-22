import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [success, setSuccess] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const checkPasswordStrength = (password) => {
    if (password.length === 0) return '';
    
    let strength = 0;
    let feedback = '';
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++; 
    if (/\d/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) strength++;
    console.log('Password:', password, 'Strength score:', strength); 
    if (strength <= 2) {
      feedback = 'weak';
    } else if (strength <= 4) {
      feedback = 'medium';
    } else {
      feedback = 'strong';
    }

    return feedback;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });
    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const result = await register(formData.name, formData.email, formData.password);
      
      if (result.success) {
        setSuccess(true);
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        setPasswordStrength('');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 'weak':
        return 'Weak password - try adding numbers or special characters';
      case 'medium':
        return 'Medium strength password - good start!';
      case 'strong':
        return 'Strong password! Excellent!';
      default:
        return '';
    }
  };

  const getPasswordTips = () => {
    if (!formData.password) return null;
    
    const tips = [];
    if (formData.password.length < 4) {
      tips.push('• Use at least 8 characters');
    }
    if (!/\d/.test(formData.password)) {
      tips.push('• Add numbers (0-9)');
    }
    if (!/[A-Z]/.test(formData.password)) {
      tips.push('• Add uppercase letters (A-Z)');
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(formData.password)) {
      tips.push('• Add special characters (!@#$% etc.)');
    }
    
    return tips.length > 0 ? tips : null;
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Join Hungry Nook</h2>
        
        {success && (
          <div className="success-message">
            <strong>Success!</strong> Registration completed! Redirecting to login page...
          </div>
        )}
        
        {error && <div className="error-message">{error}</div>}
        
        {!success ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
              />
            </div>
            
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
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
              />
              {passwordStrength && (
                <div className={`password-strength ${passwordStrength}`}>
                  {getPasswordStrengthText()}
                  {passwordStrength === 'weak' && getPasswordTips() && (
                    <div style={{marginTop: '0.5rem', fontSize: '0.75rem'}}>
                      <strong>Tips to improve:</strong>
                      {getPasswordTips().map((tip, index) => (
                        <div key={index}>{tip}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label>Confirm Password:</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm your password"
              />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <div className="password-strength weak" style={{marginTop: '0.5rem'}}>
                  Passwords do not match
                </div>
              )}
            </div>
            
            <button type="submit" disabled={loading}>
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>
        ) : (
          <div style={{textAlign: 'center', padding: '2rem'}}>
            <p>Your account has been created successfully!</p>
            <p>Redirecting to login page...</p>
          </div>
        )}
        
        <p>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;