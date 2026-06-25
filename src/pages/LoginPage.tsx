import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../config/api';
import '../css/AuthPages.css';

function LoginPage() {
  const navigate = useNavigate();
  const [nimNis, setNimNis] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/login', { nim_nis: nimNis.trim(), password });
      const { token, user } = res.data.data;

      // Store credentials BEFORE navigating so interceptors have the token
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Use replace:true so the back button doesn't return to login
      const destination = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
      navigate(destination, { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login gagal. Periksa NIM/NIS dan password Anda.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-left"></div>
      <div className="auth-bg-right"></div>

      <div className="auth-card animate-fade-in-up">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-avatar">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="8" r="5" />
              <path d="M20 21a8 8 0 10-16 0" />
            </svg>
          </div>
          <h1 className="auth-title">Sistem Absensi PKL</h1>
          <p className="auth-subtitle">BPTI UHAMKA</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="auth-error animate-fade-in">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label htmlFor="nimNis" className="form-label">NIM / NIS</label>
            <div className="input-wrapper">
              <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21a8 8 0 10-16 0" />
                <circle cx="12" cy="8" r="5" />
              </svg>
              <input
                id="nimNis"
                type="text"
                value={nimNis}
                onChange={(e) => setNimNis(e.target.value)}
                placeholder="Masukkan NIM/NIS"
                className="form-input"
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <div className="input-wrapper">
              <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="form-input"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <div className="btn-spinner"></div>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
                </svg>
                <span>Masuk</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="auth-footer">
          <p>Belum terdaftar?</p>
          <Link to="/register" className="auth-link">Daftar PKL Sekarang</Link>
        </div>

        {/* Back to home */}
        <Link to="/" className="auth-back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}

export default LoginPage;
