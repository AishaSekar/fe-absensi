import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../config/api';
import '../css/AuthPages.css';

function RegisterPage() {
  const navigate = useNavigate();
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nimNis, setNimNis] = useState('');
  const [asalInstansi, setAsalInstansi] = useState('');
  const [jurusan, setJurusan] = useState('');
  const [noHp, setNoHp] = useState('');
  const [fileSurat, setFileSurat] = useState<File | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok.');
      return;
    }

    if (password.length < 8) {
      setError('Password minimal 8 karakter.');
      return;
    }

    if (!fileSurat) {
      setError('File surat pengantar wajib diunggah (PDF).');
      return;
    }

    setLoading(true);

    try {
      // 1. Register User
      await api.post('/register', {
        nama: nama.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      // 2. Auto Login to get token for next steps
      const loginRes = await api.post('/login', {
        email: email.trim().toLowerCase(),
        password,
      });
      const token = loginRes.data?.data?.token;
      const userData = loginRes.data?.data?.user;

      if (!token || !userData) {
        throw new Error('Gagal mendapatkan token autentikasi.');
      }

      // Temporary axios config with the new token
      const authConfig = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // 3. Create Peserta using User ID
      await api.post('/peserta', {
        id_user: userData.id_user,
        nim_nis: nimNis.trim(),
        asal_instansi: asalInstansi.trim(),
        jurusan: jurusan.trim(),
        no_hp: noHp.trim(),
      }, authConfig);

      // 4. Create Pendaftaran (Upload File Surat)
      const fd = new FormData();
      fd.append('file_surat', fileSurat);
      await api.post('/pendaftaran', fd, {
        headers: { ...authConfig.headers, 'Content-Type': 'multipart/form-data' }
      });

      // Show success and redirect to login (forcing them to login normally, or redirect to dashboard directly)
      setSuccess('Registrasi dan pendaftaran PKL berhasil! Silakan masuk ke akun Anda.');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registrasi gagal. Silakan periksa kembali data Anda.';
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ padding: '2rem 1rem' }}>
      <div className="auth-bg-left"></div>
      <div className="auth-bg-right"></div>

      <div className="auth-card animate-fade-in-up" style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
        {/* Header */}
        <div className="auth-header">
          <div className="auth-avatar auth-avatar-register">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
          </div>
          <h1 className="auth-title">Daftar Akun & PKL</h1>
          <p className="auth-subtitle">Isi formulir berikut untuk mendaftar akun dan mengajukan PKL</p>
        </div>

        {/* Error / Success */}
        {error && (
          <div className="auth-error animate-fade-in">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="auth-success animate-fade-in">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="auth-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'start' }}>
          {/* Column 1: Akun */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1rem', color: '#0f3d24', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>Informasi Akun</h3>
            
            <div className="form-group">
              <label htmlFor="nama" className="form-label">Nama Lengkap</label>
              <div className="input-wrapper">
                <input id="nama" type="text" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama lengkap" className="form-input" style={{ paddingLeft: '1rem' }} required />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <div className="input-wrapper">
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" className="form-input" style={{ paddingLeft: '1rem' }} required />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <div className="input-wrapper">
                <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 karakter" className="form-input" style={{ paddingLeft: '1rem' }} required minLength={8} />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                  {showPassword ? "Tutup" : "Lihat"}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Konfirmasi Password</label>
              <div className="input-wrapper">
                <input id="confirmPassword" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Ulangi password" className="form-input" style={{ paddingLeft: '1rem' }} required />
              </div>
            </div>
          </div>

          {/* Column 2: Data PKL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1rem', color: '#0f3d24', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>Data Pendaftaran PKL</h3>

            <div className="form-group">
              <label htmlFor="nimNis" className="form-label">NIM / NIS</label>
              <div className="input-wrapper">
                <input id="nimNis" type="text" value={nimNis} onChange={(e) => setNimNis(e.target.value)} placeholder="Nomor Induk" className="form-input" style={{ paddingLeft: '1rem' }} required />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="asalInstansi" className="form-label">Asal Instansi</label>
              <div className="input-wrapper">
                <input id="asalInstansi" type="text" value={asalInstansi} onChange={(e) => setAsalInstansi(e.target.value)} placeholder="Sekolah / Kampus" className="form-input" style={{ paddingLeft: '1rem' }} required />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="jurusan" className="form-label">Jurusan</label>
              <div className="input-wrapper">
                <input id="jurusan" type="text" value={jurusan} onChange={(e) => setJurusan(e.target.value)} placeholder="Teknik Informatika" className="form-input" style={{ paddingLeft: '1rem' }} required />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="noHp" className="form-label">Nomor HP</label>
              <div className="input-wrapper">
                <input id="noHp" type="tel" value={noHp} onChange={(e) => setNoHp(e.target.value)} placeholder="0812xxxxxx" className="form-input" style={{ paddingLeft: '1rem' }} required />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="fileSurat" className="form-label">Surat Pengantar (PDF)</label>
              <div className="input-wrapper" style={{ padding: '0.5rem 0' }}>
                <input id="fileSurat" type="file" accept=".pdf" onChange={(e) => setFileSurat(e.target.files?.[0] || null)} style={{ fontSize: '0.85rem' }} required />
              </div>
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
            <button type="submit" className="auth-submit-btn pkl-register-submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? <div className="btn-spinner"></div> : "Kirim Pendaftaran & Daftar Akun"}
            </button>
          </div>
        </form>

        <div className="auth-footer" style={{ marginTop: '1.5rem' }}>
          <p>Sudah punya akun?</p>
          <Link to="/login" className="auth-link">Masuk di sini</Link>
        </div>

        <Link to="/" className="auth-back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}

export default RegisterPage;
