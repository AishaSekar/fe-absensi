import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';
import '../../css/Dashboard.css';

interface User {
  id_user: number;
  nama: string;
  email: string;
  role: string;
}

interface AbsensiRecord {
  id_absensi: number;
  tanggal: string;
  jam_masuk?: string;
  jam_pulang?: string;
  status: string;
  lokasi?: string;
}

interface PendaftaranRecord {
  id_pendaftaran: number;
  status: string;
  tanggal_daftar: string;
  file_surat: string;
}

function UserDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Absensi states
  const [absensiHistory, setAbsensiHistory] = useState<AbsensiRecord[]>([]);
  const [loadingAbsensi, setLoadingAbsensi] = useState(false);
  const [absenMsg, setAbsenMsg] = useState({ type: '', text: '' });
  const [lokasi, setLokasi] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [submittingAbsen, setSubmittingAbsen] = useState(false);

  // Pendaftaran states
  const [pendaftaranList, setPendaftaranList] = useState<PendaftaranRecord[]>([]);
  const [loadingPendaftaran, setLoadingPendaftaran] = useState(false);
  const [fileSurat, setFileSurat] = useState<File | null>(null);
  const [submittingPendaftaran, setSubmittingPendaftaran] = useState(false);
  const [pendaftaranMsg, setPendaftaranMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (activeMenu === 'riwayat' || activeMenu === 'dashboard') fetchAbsensiHistory();
    if (activeMenu === 'pendaftaran') fetchPendaftaran();
  }, [activeMenu]);

  const fetchAbsensiHistory = async () => {
    setLoadingAbsensi(true);
    try {
      const res = await api.get('/absensi/history');
      setAbsensiHistory(res.data.data || []);
    } catch { setAbsensiHistory([]); }
    finally { setLoadingAbsensi(false); }
  };

  const fetchPendaftaran = async () => {
    setLoadingPendaftaran(true);
    try {
      const res = await api.get('/pendaftaran');
      setPendaftaranList(res.data.data || []);
    } catch { setPendaftaranList([]); }
    finally { setLoadingPendaftaran(false); }
  };

  const handleAbsenMasuk = async () => {
    if (!lokasi.trim()) { setAbsenMsg({ type: 'error', text: 'Lokasi wajib diisi' }); return; }
    if (!foto) { setAbsenMsg({ type: 'error', text: 'Foto wajib diupload' }); return; }
    setSubmittingAbsen(true);
    setAbsenMsg({ type: '', text: '' });
    try {
      const fd = new FormData();
      fd.append('lokasi', lokasi);
      fd.append('foto', foto);
      await api.post('/absensi/masuk', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAbsenMsg({ type: 'success', text: 'Absensi masuk berhasil!' });
      setLokasi(''); setFoto(null);
      fetchAbsensiHistory();
    } catch (err: any) {
      setAbsenMsg({ type: 'error', text: err.response?.data?.message || 'Gagal absen masuk' });
    } finally { setSubmittingAbsen(false); }
  };

  const handleAbsenPulang = async () => {
    setSubmittingAbsen(true);
    setAbsenMsg({ type: '', text: '' });
    try {
      const fd = new FormData();
      if (lokasi.trim()) fd.append('lokasi', lokasi);
      await api.post('/absensi/pulang', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAbsenMsg({ type: 'success', text: 'Absensi pulang berhasil!' });
      fetchAbsensiHistory();
    } catch (err: any) {
      setAbsenMsg({ type: 'error', text: err.response?.data?.message || 'Gagal absen pulang' });
    } finally { setSubmittingAbsen(false); }
  };

  const handlePendaftaran = async () => {
    if (!fileSurat) { setPendaftaranMsg({ type: 'error', text: 'File surat wajib diupload (PDF)' }); return; }
    setSubmittingPendaftaran(true);
    setPendaftaranMsg({ type: '', text: '' });
    try {
      const fd = new FormData();
      fd.append('file_surat', fileSurat);
      await api.post('/pendaftaran', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPendaftaranMsg({ type: 'success', text: 'Pendaftaran berhasil dikirim!' });
      setFileSurat(null);
      fetchPendaftaran();
    } catch (err: any) {
      setPendaftaranMsg({ type: 'error', text: err.response?.data?.message || 'Gagal mengirim pendaftaran' });
    } finally { setSubmittingPendaftaran(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const formatDate = (d: Date) => d.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const formatTime = (d: Date) => d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formatDateStr = (s: string) => { try { return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return s; } };
  const formatTimeStr = (s?: string) => { if (!s) return '-'; try { const d = new Date(s); return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }); } catch { return s; } };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
    { id: 'absensi', label: 'Absensi', icon: 'clock' },
    { id: 'riwayat', label: 'Riwayat', icon: 'list' },
    { id: 'pendaftaran', label: 'Pendaftaran', icon: 'file' },
    { id: 'profil', label: 'Profil', icon: 'user' },
  ];

  const getIcon = (icon: string) => {
    const icons: Record<string, JSX.Element> = {
      grid: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
      clock: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
      list: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
      file: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
      user: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    };
    return icons[icon] || null;
  };

  // Dashboard stats from history
  const hadirCount = absensiHistory.filter(a => a.status === 'hadir').length;
  const telatCount = absensiHistory.filter(a => a.status === 'telat').length;
  const totalDays = absensiHistory.length;

  const getMenuTitle = () => {
    const item = menuItems.find(m => m.id === activeMenu);
    if (activeMenu === 'riwayat') return 'Riwayat Absensi';
    if (activeMenu === 'pendaftaran') return 'Pendaftaran PKL';
    if (activeMenu === 'profil') return 'Profil Saya';
    return item?.label || 'Dashboard';
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.1 2.7 2 6 2s6-.9 6-2v-5"/></svg>
            </div>
            {sidebarOpen && <div className="sidebar-brand-text"><span className="sidebar-brand-name">BPTI</span><span className="sidebar-brand-sub">Absensi PKL</span></div>}
          </div>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button key={item.id} className={`sidebar-nav-item ${activeMenu === item.id ? 'active' : ''}`} onClick={() => setActiveMenu(item.id)} title={item.label}>
              {getIcon(item.icon)}
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="sidebar-logout" onClick={handleLogout} title="Keluar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            {sidebarOpen && <span>Keluar</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="dashboard-main">
        <header className="topbar">
          <button className="topbar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div className="topbar-info"><h2 className="topbar-title">{getMenuTitle()}</h2></div>
          <div className="topbar-user">
            <div className="topbar-user-info"><span className="topbar-user-name">{user?.nama || 'User'}</span><span className="topbar-user-role">Peserta</span></div>
            <div className="topbar-user-avatar">{(user?.nama || 'U').charAt(0).toUpperCase()}</div>
          </div>
        </header>

        <div className="dashboard-content">
          {/* ======= DASHBOARD HOME ======= */}
          {activeMenu === 'dashboard' && (
            <div className="dashboard-home">
              <div className="welcome-card">
                <div className="welcome-content">
                  <h3>Selamat Datang, {user?.nama || 'Peserta'}! 👋</h3>
                  <p>{formatDate(currentTime)}</p>
                  <div className="welcome-time">{formatTime(currentTime)}</div>
                </div>
                <div className="welcome-actions">
                  <button className="btn-absen btn-masuk-absen" onClick={() => setActiveMenu('absensi')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    Absen Masuk
                  </button>
                  <button className="btn-absen btn-pulang-absen" onClick={() => setActiveMenu('absensi')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                    Absen Pulang
                  </button>
                </div>
              </div>

              <div className="stats-grid">
                <div className="dash-stat-card">
                  <div className="dash-stat-icon" style={{ background: '#d1fae5', color: '#10b981' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div className="dash-stat-info"><div className="dash-stat-value" style={{ color: '#10b981' }}>{hadirCount}</div><div className="dash-stat-label">Hadir</div></div>
                </div>
                <div className="dash-stat-card">
                  <div className="dash-stat-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </div>
                  <div className="dash-stat-info"><div className="dash-stat-value" style={{ color: '#f59e0b' }}>{telatCount}</div><div className="dash-stat-label">Telat</div></div>
                </div>
                <div className="dash-stat-card">
                  <div className="dash-stat-icon" style={{ background: '#dbeafe', color: '#3b82f6' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </div>
                  <div className="dash-stat-info"><div className="dash-stat-value" style={{ color: '#3b82f6' }}>{totalDays}</div><div className="dash-stat-label">Total Hari</div></div>
                </div>
                <div className="dash-stat-card">
                  <div className="dash-stat-icon" style={{ background: '#ede9fe', color: '#8b5cf6' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </div>
                  <div className="dash-stat-info"><div className="dash-stat-value" style={{ color: '#8b5cf6' }}>{totalDays > 0 ? Math.round((hadirCount / totalDays) * 100) : 0}%</div><div className="dash-stat-label">Persentase</div></div>
                </div>
              </div>

              <div className="dash-table-card">
                <div className="dash-table-header">
                  <h3>Riwayat Absensi Terbaru</h3>
                  <button className="dash-table-link" onClick={() => setActiveMenu('riwayat')}>Lihat Semua →</button>
                </div>
                <div className="dash-table-wrapper">
                  <table className="dash-table">
                    <thead><tr><th>Tanggal</th><th>Jam Masuk</th><th>Jam Pulang</th><th>Status</th></tr></thead>
                    <tbody>
                      {absensiHistory.slice(0, 5).map((row) => (
                        <tr key={row.id_absensi}>
                          <td>{formatDateStr(row.tanggal)}</td>
                          <td>{formatTimeStr(row.jam_masuk)}</td>
                          <td>{formatTimeStr(row.jam_pulang)}</td>
                          <td><span className={`status-badge status-${row.status.replace(' ', '-')}`}>{row.status}</span></td>
                        </tr>
                      ))}
                      {absensiHistory.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: '#8a8a9e' }}>Belum ada riwayat absensi</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======= ABSENSI ======= */}
          {activeMenu === 'absensi' && (
            <div className="dashboard-home">
              <div className="dash-table-card" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', color: '#0f3d24', fontSize: '1.2rem' }}>Form Absensi</h3>
                {absenMsg.text && (
                  <div className={`auth-${absenMsg.type} animate-fade-in`} style={{ marginBottom: '1rem' }}>
                    <span>{absenMsg.text}</span>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '500px' }}>
                  <div className="form-group">
                    <label className="form-label">Lokasi</label>
                    <input type="text" className="form-input" style={{ paddingLeft: '1rem' }} value={lokasi} onChange={e => setLokasi(e.target.value)} placeholder="Masukkan lokasi Anda" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Foto Selfie</label>
                    <input type="file" accept="image/*" onChange={e => setFoto(e.target.files?.[0] || null)} style={{ fontSize: '0.88rem' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                    <button className="btn-absen btn-masuk-absen" onClick={handleAbsenMasuk} disabled={submittingAbsen} style={{ border: '2px solid #1a5c38' }}>
                      {submittingAbsen ? 'Memproses...' : '✓ Absen Masuk'}
                    </button>
                    <button className="btn-absen btn-pulang-absen" onClick={handleAbsenPulang} disabled={submittingAbsen} style={{ background: '#1a5c38', color: '#fff' }}>
                      {submittingAbsen ? 'Memproses...' : '→ Absen Pulang'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======= RIWAYAT ======= */}
          {activeMenu === 'riwayat' && (
            <div className="dashboard-home">
              <div className="dash-table-card">
                <div className="dash-table-header"><h3>Riwayat Absensi Lengkap</h3></div>
                <div className="dash-table-wrapper">
                  {loadingAbsensi ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#8a8a9e' }}>Memuat data...</div>
                  ) : (
                    <table className="dash-table">
                      <thead><tr><th>No</th><th>Tanggal</th><th>Jam Masuk</th><th>Jam Pulang</th><th>Status</th><th>Lokasi</th></tr></thead>
                      <tbody>
                        {absensiHistory.map((row, i) => (
                          <tr key={row.id_absensi}>
                            <td>{i + 1}</td>
                            <td>{formatDateStr(row.tanggal)}</td>
                            <td>{formatTimeStr(row.jam_masuk)}</td>
                            <td>{formatTimeStr(row.jam_pulang)}</td>
                            <td><span className={`status-badge status-${row.status.replace(' ', '-')}`}>{row.status}</span></td>
                            <td>{row.lokasi || '-'}</td>
                          </tr>
                        ))}
                        {absensiHistory.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: '#8a8a9e' }}>Belum ada riwayat</td></tr>}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ======= PENDAFTARAN ======= */}
          {activeMenu === 'pendaftaran' && (
            <div className="dashboard-home">
              <div className="dash-table-card" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', color: '#0f3d24', fontSize: '1.2rem' }}>Ajukan Pendaftaran PKL</h3>
                {pendaftaranMsg.text && (
                  <div className={`auth-${pendaftaranMsg.type} animate-fade-in`} style={{ marginBottom: '1rem' }}>
                    <span>{pendaftaranMsg.text}</span>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '500px' }}>
                  <div className="form-group">
                    <label className="form-label">Upload Surat Pengantar (PDF)</label>
                    <input type="file" accept=".pdf" onChange={e => setFileSurat(e.target.files?.[0] || null)} style={{ fontSize: '0.88rem' }} />
                  </div>
                  <button className="auth-submit-btn" style={{ maxWidth: '250px' }} onClick={handlePendaftaran} disabled={submittingPendaftaran}>
                    {submittingPendaftaran ? 'Mengirim...' : 'Kirim Pendaftaran'}
                  </button>
                </div>
              </div>

              <div className="dash-table-card">
                <div className="dash-table-header"><h3>Riwayat Pendaftaran</h3></div>
                <div className="dash-table-wrapper">
                  {loadingPendaftaran ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#8a8a9e' }}>Memuat data...</div>
                  ) : (
                    <table className="dash-table">
                      <thead><tr><th>No</th><th>Tanggal Daftar</th><th>Status</th></tr></thead>
                      <tbody>
                        {pendaftaranList.map((p, i) => (
                          <tr key={p.id_pendaftaran}>
                            <td>{i + 1}</td>
                            <td>{formatDateStr(p.tanggal_daftar)}</td>
                            <td><span className={`status-badge status-${p.status}`}>{p.status}</span></td>
                          </tr>
                        ))}
                        {pendaftaranList.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', color: '#8a8a9e' }}>Belum ada pendaftaran</td></tr>}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ======= PROFIL ======= */}
          {activeMenu === 'profil' && (
            <div className="dashboard-home">
              <div className="dash-table-card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div className="topbar-user-avatar" style={{ width: '72px', height: '72px', fontSize: '1.8rem', borderRadius: '18px' }}>
                    {(user?.nama || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ color: '#0f3d24', fontSize: '1.3rem' }}>{user?.nama}</h3>
                    <p style={{ color: '#8a8a9e', fontSize: '0.9rem' }}>{user?.email}</p>
                    <span className="status-badge status-hadir" style={{ marginTop: '0.5rem', display: 'inline-block' }}>{user?.role}</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: '500px' }}>
                  <div><label style={{ fontSize: '0.78rem', color: '#8a8a9e', fontWeight: 600, textTransform: 'uppercase' as const }}>ID User</label><p style={{ fontWeight: 600, color: '#0f3d24' }}>{user?.id_user}</p></div>
                  <div><label style={{ fontSize: '0.78rem', color: '#8a8a9e', fontWeight: 600, textTransform: 'uppercase' as const }}>Role</label><p style={{ fontWeight: 600, color: '#0f3d24', textTransform: 'capitalize' as const }}>{user?.role}</p></div>
                  <div><label style={{ fontSize: '0.78rem', color: '#8a8a9e', fontWeight: 600, textTransform: 'uppercase' as const }}>Nama</label><p style={{ fontWeight: 600, color: '#0f3d24' }}>{user?.nama}</p></div>
                  <div><label style={{ fontSize: '0.78rem', color: '#8a8a9e', fontWeight: 600, textTransform: 'uppercase' as const }}>Email</label><p style={{ fontWeight: 600, color: '#0f3d24' }}>{user?.email}</p></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default UserDashboard;
