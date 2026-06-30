import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { Compass, Mail, Lock, ShieldAlert, ArrowRight } from 'lucide-react';

export const Login = () => {
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [errorMsg, setErrorMsg]   = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login }    = useAuth();
  const { post }     = useFetch();
  const navigate     = useNavigate();

  const redirectPath = '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const result = await post('/auth/login', { email, password });
      if (result.success) {
        login(result.data.token, result.data.user);
        navigate(redirectPath, { replace: true });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
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
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">
            Sign in to continue trading on GeoMarket
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
            <label className="form-label" htmlFor="login-email">Email Address</label>
            <div className="auth-input-container">
              <Mail
                size={16}
                className="auth-input-icon"
              />
              <input
                id="login-email"
                type="email"
                className="form-input auth-input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div className="form-group auth-form-group-spaced">
            <label className="form-label" htmlFor="login-password">Password</label>
            <div className="auth-input-container">
              <Lock
                size={16}
                className="auth-input-icon"
              />
              <input
                id="login-password"
                type="password"
                className="form-input auth-input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className="btn btn-primary btn-lg auth-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner spinner-sm" />
                Signing in…
              </>
            ) : (
              <>Sign In <ArrowRight size={16} /></>
            )}
          </button>
        </form>

        {/* Footer link */}
        <div className="divider-text auth-divider-text">or</div>

        <p className="auth-footer-text">
          Don't have an account?{' '}
          <Link to="/register" className="auth-footer-link">
            Create one
          </Link>
        </p>

        {/* Quick Demo Login Info */}
        <div className="demo-accounts-box">
          <p className="demo-accounts-title">
            🔑 Demo Accounts:
          </p>
          <div className="demo-accounts-list">
            <div>
              <strong>Admin:</strong> <code className="demo-accounts-code">admin@c2c.com</code> / <code className="demo-accounts-code">Admin123!</code>
            </div>
            <div>
              <strong>User:</strong> <code className="demo-accounts-code">john@c2c.com</code> / <code className="demo-accounts-code">Client123!</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
