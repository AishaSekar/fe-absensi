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
  const [divisi, setDivisi] = useState('');
  const [noHp, setNoHp] = useState('');
  const [fileSurat, setFileSurat] = useState<File | null>(null);
  const [fileCV, setFileCV] = useState<File | null>(null);
  const [fileSuratLamaran, setFileSuratLamaran] = useState<File | null>(null);

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
    if (!divisi) {
      setError('Divisi wajib dipilih.');
      return;
    }
    if (!fileSurat) {
      setError('File surat pengantar wajib diunggah.');
      return;
    }

    if (!fileCV) {
      setError('File CV wajib diunggah.');
      return;
    }

    if (!fileSuratLamaran) {
      setError('File surat lamaran wajib diunggah.');
      return;
    }

    setLoading(true);

    try {
      // 1. Register User + Peserta sekaligus
      await api.post('/register', {
        nama: nama.trim(),
        email: email.trim().toLowerCase(),
        password,
        nim_nis: nimNis.trim(),
        asal_instansi: asalInstansi.trim(),
        jurusan: jurusan.trim(),
        no_hp: noHp.trim() || undefined,
      });

      // 2. Auto Login untuk mendapatkan token
      const loginRes = await api.post('/login', {
        nim_nis: nimNis.trim(),
        password,
      });
      const token = loginRes.data?.data?.token;

      if (!token) {
        throw new Error('Gagal mendapatkan token autentikasi.');
      }

      // 3. Upload File Surat Pengantar, CV, dan Surat Lamaran
      const fd = new FormData();
      fd.append('file_surat', fileSurat);
      fd.append('file_cv', fileCV);
      fd.append('file_surat_lamaran', fileSuratLamaran);
      fd.append('divisi', divisi);
      await api.post('/pendaftaran', fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('Registrasi dan pendaftaran PKL berhasil! Silakan masuk ke akun Anda.');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      const msgRaw = err.response?.data?.message;
      // Jika message berupa array (validation errors), gabungkan
      const msg = Array.isArray(msgRaw)
        ? msgRaw.join(', ')
        : msgRaw || 'Registrasi gagal. Silakan periksa kembali data Anda.';
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ padding: '2rem 1rem' }}>
      <div className="auth-bg-left"></div>
      <div className="auth-bg-right"></div>

      <div className="auth-card pkl-register-card animate-fade-in-up">
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

        <form onSubmit={handleRegister} className="auth-form pkl-register-form">
          {/* Column 1: Akun */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <h3 style={{ fontSize: '1rem', color: '#0f3d24', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '0.5rem', fontWeight: 700 }}>Informasi Akun</h3>
            
            <div className="form-group">
              <label htmlFor="nama" className="form-label">Nama Lengkap</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21a8 8 0 10-16 0" />
                  <circle cx="12" cy="8" r="5" />
                </svg>
                <input id="nama" type="text" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama lengkap" className="form-input" required />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 7l-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" />
                </svg>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" className="form-input" required />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 karakter" className="form-input" required minLength={8} />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                  {showPassword ? "Tutup" : "Lihat"}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Konfirmasi Password</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <input id="confirmPassword" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Ulangi password" className="form-input" required />
              </div>
            </div>
          </div>

          {/* Column 2: Data PKL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <h3 style={{ fontSize: '1rem', color: '#0f3d24', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '0.5rem', fontWeight: 700 }}>Data Pendaftaran PKL</h3>

            <div className="form-group">
              <label htmlFor="nimNis" className="form-label">NIM / NIS</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <line x1="7" y1="8" x2="17" y2="8" />
                  <line x1="7" y1="12" x2="17" y2="12" />
                  <line x1="7" y1="16" x2="13" y2="16" />
                </svg>
                <input id="nimNis" type="text" value={nimNis} onChange={(e) => setNimNis(e.target.value)} placeholder="Nomor Induk Siswa/Mahasiswa" className="form-input" required />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="asalInstansi" className="form-label">Asal Instansi</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                </svg>
                <input id="asalInstansi" type="text" value={asalInstansi} onChange={(e) => setAsalInstansi(e.target.value)} placeholder="Sekolah / Kampus" className="form-input" required />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="jurusan" className="form-label">Jurusan</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
                </svg>
                <input id="jurusan" type="text" value={jurusan} onChange={(e) => setJurusan(e.target.value)} placeholder="Teknik Informatika / RPL" className="form-input" required />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="divisi" className="form-label">Divisi</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
                </svg>
                <select
                  id="divisi"
                  value={divisi}
                  onChange={(e) => setDivisi(e.target.value)}
                  className="form-input"
                  style={{ appearance: 'auto', background: 'white' }}
                  required
                >
                  <option value="" disabled>Pilih Divisi</option>
                  <option value="Software Engineering">Software Engineering</option>
                  <option value="Data Analyst">Data Analyst</option>
                  <option value="Computer Network">Computer Network</option>
                  <option value="Multimedia">Multimedia</option>
                  <option value="Cyber Security">Cyber Security</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="noHp" className="form-label">Nomor HP</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                </svg>
                <input id="noHp" type="tel" value={noHp} onChange={(e) => setNoHp(e.target.value)} placeholder="0812xxxxxx" className="form-input" required />
              </div>
            </div>
          </div>

          {/* Files section spanned across the grid columns for beautiful aesthetics */}
          <div className="form-group pkl-register-upload">
            <label className="form-label">Surat Pengantar (PDF / JPG/ PNG/ JPEG)</label>
            <label htmlFor="fileSurat" className="pkl-register-upload-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>{fileSurat ? fileSurat.name : "Pilih file Surat Pengantar"}</span>
            </label>
            <input id="fileSurat" type="file" accept=".pdf,image/*" onChange={(e) => setFileSurat(e.target.files?.[0] || null)} required />
          </div>

          <div className="form-group pkl-register-upload">
            <label className="form-label">Curriculum Vitae (CV) (PDF / JPG/ PNG/ JPEG)</label>
            <label htmlFor="fileCV" className="pkl-register-upload-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>{fileCV ? fileCV.name : "Pilih file CV"}</span>
            </label>
            <input id="fileCV" type="file" accept=".pdf,image/*" onChange={(e) => setFileCV(e.target.files?.[0] || null)} required />
          </div>

          <div className="form-group pkl-register-upload">
            <label className="form-label">Surat Lamaran (PDF / JPG/ PNG/ JPEG)</label>
            <label htmlFor="fileSuratLamaran" className="pkl-register-upload-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>{fileSuratLamaran ? fileSuratLamaran.name : "Pilih file Surat Lamaran"}</span>
            </label>
            <input id="fileSuratLamaran" type="file" accept=".pdf,image/*" onChange={(e) => setFileSuratLamaran(e.target.files?.[0] || null)} required />
          </div>

          <div className="pkl-register-submit" style={{ marginTop: '0.8rem' }}>
            <button type="submit" className="auth-submit-btn" disabled={loading} style={{ width: '100%' }}>
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
