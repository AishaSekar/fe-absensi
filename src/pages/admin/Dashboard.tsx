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

interface DashboardStats {
  total_peserta: number;
  hadir_hari_ini: number;
  telat_hari_ini: number;
  pending_pendaftaran: number;
}

interface Peserta {
  id_peserta: number;
  id_user: number;
  nim_nis: string;
  asal_instansi: string;
  jurusan: string;
  no_hp?: string;
  status_pkl: string;
  created_at: string;
  user?: { nama: string; email: string };
}

interface PendaftaranRecord {
  id_pendaftaran: number;
  id_user: number;
  status: string;
  tanggal_daftar: string;
  file_surat: string;
  user?: { nama: string; email: string };
}

interface AbsensiRecord {
  id_absensi: number;
  id_peserta: number;
  tanggal: string;
  jam_masuk?: string;
  jam_pulang?: string;
  status: string;
  lokasi?: string;
  peserta?: { nim_nis: string; user?: { nama: string } };
}

function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('dashboard');

  // Dashboard
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Peserta
  const [pesertaList, setPesertaList] = useState<Peserta[]>([]);
  const [loadingPeserta, setLoadingPeserta] = useState(false);

  // Pendaftaran
  const [pendaftaranList, setPendaftaranList] = useState<PendaftaranRecord[]>([]);
  const [loadingPendaftaran, setLoadingPendaftaran] = useState(false);
  const [verifikasiMsg, setVerifikasiMsg] = useState({ type: '', text: '' });

  // Absensi
  const [absensiList, setAbsensiList] = useState<AbsensiRecord[]>([]);
  const [loadingAbsensi, setLoadingAbsensi] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    if (activeMenu === 'dashboard') fetchStats();
    if (activeMenu === 'peserta') fetchPeserta();
    if (activeMenu === 'pendaftaran') fetchPendaftaran();
    if (activeMenu === 'absensi') fetchAbsensi();
  }, [activeMenu]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await api.get('/admin/dashboard');
      setStats(res.data.data);
    } catch { setStats(null); }
    finally { setLoadingStats(false); }
  };

  const fetchPeserta = async () => {
    setLoadingPeserta(true);
    try {
      const res = await api.get('/peserta');
      setPesertaList(res.data.data || []);
    } catch { setPesertaList([]); }
    finally { setLoadingPeserta(false); }
  };

  const fetchPendaftaran = async () => {
    setLoadingPendaftaran(true);
    try {
      const res = await api.get('/pendaftaran');
      setPendaftaranList(res.data.data || []);
    } catch { setPendaftaranList([]); }
    finally { setLoadingPendaftaran(false); }
  };

  const fetchAbsensi = async () => {
    setLoadingAbsensi(true);
    try {
      const res = await api.get('/absensi/history');
      setAbsensiList(res.data.data || []);
    } catch { setAbsensiList([]); }
    finally { setLoadingAbsensi(false); }
  };

  const handleVerifikasi = async (id: number, status: 'diterima' | 'ditolak') => {
    setVerifikasiMsg({ type: '', text: '' });
    try {
      await api.put(`/pendaftaran/${id}/verifikasi`, { status });
      setVerifikasiMsg({ type: 'success', text: `Pendaftaran berhasil ${status}` });
      fetchPendaftaran();
      fetchStats();
    } catch (err: any) {
      setVerifikasiMsg({ type: 'error', text: err.response?.data?.message || 'Gagal memverifikasi' });
    }
  };

  const handleDeletePeserta = async (id: number) => {
    if (!confirm('Yakin ingin menghapus peserta ini?')) return;
    try {
      await api.delete(`/peserta/${id}`);
      fetchPeserta();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus peserta');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const formatDateStr = (s: string) => { try { return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return s; } };
  const formatTimeStr = (s?: string) => { if (!s) return '-'; try { const d = new Date(s); return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }); } catch { return s; } };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
    { id: 'peserta', label: 'Data Peserta', icon: 'users' },
    { id: 'absensi', label: 'Data Absensi', icon: 'clock' },
    { id: 'pendaftaran', label: 'Pendaftaran', icon: 'file' },
  ];

  const getIcon = (icon: string) => {
    const icons: Record<string, JSX.Element> = {
      grid: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
      users: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
      clock: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
      file: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    };
    return icons[icon] || null;
  };

  const getMenuTitle = () => {
    if (activeMenu === 'peserta') return 'Data Peserta';
    if (activeMenu === 'absensi') return 'Data Absensi';
    if (activeMenu === 'pendaftaran') return 'Verifikasi Pendaftaran';
    return 'Dashboard Admin';
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className={`sidebar sidebar-admin ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            {sidebarOpen && <div className="sidebar-brand-text"><span className="sidebar-brand-name">Admin</span><span className="sidebar-brand-sub">BPTI UHAMKA</span></div>}
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
            <div className="topbar-user-info"><span className="topbar-user-name">{user?.nama || 'Admin'}</span><span className="topbar-user-role">Administrator</span></div>
            <div className="topbar-user-avatar" style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)' }}>{(user?.nama || 'A').charAt(0).toUpperCase()}</div>
          </div>
        </header>

        <div className="dashboard-content">
          {/* ======= ADMIN DASHBOARD ======= */}
          {activeMenu === 'dashboard' && (
            <div className="dashboard-home">
              <div className="welcome-card" style={{ background: 'linear-gradient(135deg, #0f3d24 0%, #1a5c38 50%, #2d8a56 100%)' }}>
                <div className="welcome-content">
                  <h3>Panel Admin 🛡️</h3>
                  <p>Kelola peserta PKL, verifikasi pendaftaran, dan pantau absensi.</p>
                </div>
              </div>

              {loadingStats ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#8a8a9e' }}>Memuat statistik...</div>
              ) : (
                <div className="stats-grid">
                  <div className="dash-stat-card">
                    <div className="dash-stat-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                    </div>
                    <div className="dash-stat-info"><div className="dash-stat-value" style={{ color: '#2563eb' }}>{stats?.total_peserta || 0}</div><div className="dash-stat-label">Total Peserta</div></div>
                  </div>
                  <div className="dash-stat-card">
                    <div className="dash-stat-icon" style={{ background: '#d1fae5', color: '#10b981' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <div className="dash-stat-info"><div className="dash-stat-value" style={{ color: '#10b981' }}>{stats?.hadir_hari_ini || 0}</div><div className="dash-stat-label">Hadir Hari Ini</div></div>
                  </div>
                  <div className="dash-stat-card">
                    <div className="dash-stat-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    </div>
                    <div className="dash-stat-info"><div className="dash-stat-value" style={{ color: '#f59e0b' }}>{stats?.telat_hari_ini || 0}</div><div className="dash-stat-label">Telat Hari Ini</div></div>
                  </div>
                  <div className="dash-stat-card">
                    <div className="dash-stat-icon" style={{ background: '#fee2e2', color: '#ef4444' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    </div>
                    <div className="dash-stat-info"><div className="dash-stat-value" style={{ color: '#ef4444' }}>{stats?.pending_pendaftaran || 0}</div><div className="dash-stat-label">Pending Daftar</div></div>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="dash-table-card" style={{ cursor: 'pointer' }} onClick={() => setActiveMenu('peserta')}>
                  <div className="dash-table-header"><h3>Data Peserta</h3><span className="dash-table-link">Kelola →</span></div>
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: '#5a5a6e' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1a5c38' }}>{stats?.total_peserta || 0}</div>
                    <div style={{ fontSize: '0.85rem' }}>Peserta terdaftar</div>
                  </div>
                </div>
                <div className="dash-table-card" style={{ cursor: 'pointer' }} onClick={() => setActiveMenu('pendaftaran')}>
                  <div className="dash-table-header"><h3>Pendaftaran</h3><span className="dash-table-link">Verifikasi →</span></div>
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: '#5a5a6e' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#ef4444' }}>{stats?.pending_pendaftaran || 0}</div>
                    <div style={{ fontSize: '0.85rem' }}>Menunggu verifikasi</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======= DATA PESERTA ======= */}
          {activeMenu === 'peserta' && (
            <div className="dashboard-home">
              <div className="dash-table-card">
                <div className="dash-table-header">
                  <h3>Daftar Peserta PKL ({pesertaList.length})</h3>
                </div>
                <div className="dash-table-wrapper">
                  {loadingPeserta ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#8a8a9e' }}>Memuat data...</div>
                  ) : (
                    <table className="dash-table">
                      <thead><tr><th>No</th><th>Nama</th><th>NIM/NIS</th><th>Asal Instansi</th><th>Jurusan</th><th>No HP</th><th>Status</th><th>Aksi</th></tr></thead>
                      <tbody>
                        {pesertaList.map((p, i) => (
                          <tr key={p.id_peserta}>
                            <td>{i + 1}</td>
                            <td style={{ fontWeight: 600 }}>{p.user?.nama || '-'}</td>
                            <td>{p.nim_nis}</td>
                            <td>{p.asal_instansi}</td>
                            <td>{p.jurusan}</td>
                            <td>{p.no_hp || '-'}</td>
                            <td><span className={`status-badge status-${p.status_pkl}`}>{p.status_pkl}</span></td>
                            <td>
                              <button onClick={() => handleDeletePeserta(p.id_peserta)} className="btn-action-delete" title="Hapus">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                        {pesertaList.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', color: '#8a8a9e' }}>Belum ada data peserta</td></tr>}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ======= DATA ABSENSI ======= */}
          {activeMenu === 'absensi' && (
            <div className="dashboard-home">
              <div className="dash-table-card">
                <div className="dash-table-header">
                  <h3>Data Absensi Seluruh Peserta</h3>
                </div>
                <div className="dash-table-wrapper">
                  {loadingAbsensi ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#8a8a9e' }}>Memuat data...</div>
                  ) : (
                    <table className="dash-table">
                      <thead><tr><th>No</th><th>Nama</th><th>Tanggal</th><th>Masuk</th><th>Pulang</th><th>Status</th><th>Lokasi</th></tr></thead>
                      <tbody>
                        {absensiList.map((a, i) => (
                          <tr key={a.id_absensi}>
                            <td>{i + 1}</td>
                            <td style={{ fontWeight: 600 }}>{a.peserta?.user?.nama || '-'}</td>
                            <td>{formatDateStr(a.tanggal)}</td>
                            <td>{formatTimeStr(a.jam_masuk)}</td>
                            <td>{formatTimeStr(a.jam_pulang)}</td>
                            <td><span className={`status-badge status-${a.status.replace(' ', '-')}`}>{a.status}</span></td>
                            <td>{a.lokasi || '-'}</td>
                          </tr>
                        ))}
                        {absensiList.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: '#8a8a9e' }}>Belum ada data absensi</td></tr>}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ======= VERIFIKASI PENDAFTARAN ======= */}
          {activeMenu === 'pendaftaran' && (
            <div className="dashboard-home">
              {verifikasiMsg.text && (
                <div className={`auth-${verifikasiMsg.type} animate-fade-in`}><span>{verifikasiMsg.text}</span></div>
              )}
              <div className="dash-table-card">
                <div className="dash-table-header">
                  <h3>Pendaftaran PKL ({pendaftaranList.length})</h3>
                </div>
                <div className="dash-table-wrapper">
                  {loadingPendaftaran ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#8a8a9e' }}>Memuat data...</div>
                  ) : (
                    <table className="dash-table">
                      <thead><tr><th>No</th><th>Nama</th><th>Email</th><th>Tanggal Daftar</th><th>File Surat</th><th>Status</th><th>Aksi</th></tr></thead>
                      <tbody>
                        {pendaftaranList.map((p, i) => (
                          <tr key={p.id_pendaftaran}>
                            <td>{i + 1}</td>
                            <td style={{ fontWeight: 600 }}>{p.user?.nama || '-'}</td>
                            <td>{p.user?.email || '-'}</td>
                            <td>{formatDateStr(p.tanggal_daftar)}</td>
                            <td>
                              <a href={`http://localhost:8080/${p.file_surat}`} target="_blank" rel="noopener noreferrer" style={{ color: '#1a5c38', fontWeight: 600, textDecoration: 'none', fontSize: '0.82rem' }}>
                                📄 Lihat File
                              </a>
                            </td>
                            <td><span className={`status-badge status-${p.status}`}>{p.status}</span></td>
                            <td>
                              {p.status === 'pending' ? (
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                  <button onClick={() => handleVerifikasi(p.id_pendaftaran, 'diterima')} className="btn-action-accept" title="Terima">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                                  </button>
                                  <button onClick={() => handleVerifikasi(p.id_pendaftaran, 'ditolak')} className="btn-action-reject" title="Tolak">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                  </button>
                                </div>
                              ) : (
                                <span style={{ fontSize: '0.8rem', color: '#8a8a9e' }}>Sudah diproses</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {pendaftaranList.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: '#8a8a9e' }}>Belum ada pendaftaran</td></tr>}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
