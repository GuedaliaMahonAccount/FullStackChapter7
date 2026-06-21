import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
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
  const location     = useLocation();

  const redirectPath = location.state?.from?.pathname || '/';

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
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="auth-brand-icon">
            <Compass size={30} style={{ color: 'var(--secondary)' }} />
          </div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 900, marginBottom: '6px' }}>Welcome Back</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Sign in to continue trading on GeoMarket
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
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
              />
              <input
                id="login-email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={{ paddingLeft: '44px' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label" htmlFor="login-password">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
              />
              <input
                id="login-password"
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ paddingLeft: '44px' }}
              />
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', borderRadius: 'var(--radius-sm)' }}
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
        <div className="divider-text" style={{ margin: '24px 0' }}>or</div>

        <p style={{ textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary-light)', fontWeight: 700 }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
