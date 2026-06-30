import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { Compass, Mail, Lock, User, ShieldAlert, ArrowRight } from 'lucide-react';

export const Register = () => {
  const [fullName, setFullName]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [errorMsg, setErrorMsg]   = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { post }  = useFetch();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const result = await post('/auth/register', { email, password, fullName });
      if (result.success) {
        navigate('/login', { state: { registered: true } });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Brand */}
        <div className="auth-header">
          <div className="auth-brand-icon">
            <Compass size={30} className="auth-logo-icon" />
          </div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">
            Join the local C2C marketplace today
          </p>
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="alert alert-error auth-alert">
            <ShieldAlert size={16} className="auth-alert-icon" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="register-name">Full Name</label>
            <div className="auth-input-container">
              <User
                size={16}
                className="auth-input-icon"
              />
              <input
                id="register-name"
                type="text"
                className="form-input auth-input-field"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-email">Email Address</label>
            <div className="auth-input-container">
              <Mail
                size={16}
                className="auth-input-icon"
              />
              <input
                id="register-email"
                type="email"
                className="form-input auth-input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                required
              />
            </div>
          </div>

          <div className="form-group auth-form-group-spaced">
            <label className="form-label" htmlFor="register-password">Password</label>
            <div className="auth-input-container">
              <Lock
                size={16}
                className="auth-input-icon"
              />
              <input
                id="register-password"
                type="password"
                className="form-input auth-input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
                minLength={6}
              />
            </div>
            <p className="form-hint">Use at least 6 characters.</p>
          </div>

          <button
            id="register-submit-btn"
            type="submit"
            className="btn btn-primary btn-lg auth-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner spinner-sm" />
                Creating account…
              </>
            ) : (
              <>Create Account <ArrowRight size={16} /></>
            )}
          </button>
        </form>

        <div className="divider-text auth-divider-text">or</div>

        <p className="auth-footer-text">
          Already have an account?{' '}
          <Link to="/login" className="auth-footer-link">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
