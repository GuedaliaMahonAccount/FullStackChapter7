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
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="auth-brand-icon">
            <Compass size={30} style={{ color: 'var(--secondary)' }} />
          </div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 900, marginBottom: '6px' }}>Create Account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Join the local C2C marketplace today
          </p>
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="alert alert-error" style={{ marginBottom: '20px' }}>
            <ShieldAlert size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="register-name">Full Name</label>
            <div style={{ position: 'relative' }}>
              <User
                size={16}
                style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
              />
              <input
                id="register-name"
                type="text"
                className="form-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                required
                style={{ paddingLeft: '44px' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
              />
              <input
                id="register-email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                required
                style={{ paddingLeft: '44px' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label" htmlFor="register-password">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
              />
              <input
                id="register-password"
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
                minLength={6}
                style={{ paddingLeft: '44px' }}
              />
            </div>
            <p className="form-hint">Use at least 6 characters.</p>
          </div>

          <button
            id="register-submit-btn"
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', borderRadius: 'var(--radius-sm)' }}
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

        <div className="divider-text" style={{ margin: '24px 0' }}>or</div>

        <p style={{ textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary-light)', fontWeight: 700 }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
