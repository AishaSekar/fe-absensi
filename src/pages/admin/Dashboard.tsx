import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Chart from 'react-apexcharts';
import api from '../../config/api';
import '../../css/Dashboard.css';
import LaporanAbsensi from './Laporan';

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
  pendaftaran?: {
    id_pendaftaran: number;
    file_surat: string;
    file_cv: string;
    file_surat_lamaran: string;
    status: string;
  };
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

interface SertifikatRecord {
  id_sertifikat: number;
  id_peserta: number;
  id_user: number;
  status: 'pending' | 'diberikan' | 'ditolak';
  file_sertifikat?: string;
  catatan?: string;
  tanggal_request: string;
  tanggal_diberikan?: string;
  peserta?: { nim_nis: string; user?: { nama: string } };
  user?: { nama: string; email: string };
}

function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [mobileOverlay, setMobileOverlay] = useState(false);

  // Dashboard
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Peserta
  const [pesertaList, setPesertaList] = useState<Peserta[]>([]);
  const [loadingPeserta, setLoadingPeserta] = useState(false);
  const [verifikasiMsg, setVerifikasiMsg] = useState({ type: '', text: '' });
  const [processingPesertaId, setProcessingPesertaId] = useState<number | null>(null);

  // Absensi
  const [absensiList, setAbsensiList] = useState<AbsensiRecord[]>([]);
  const [loadingAbsensi, setLoadingAbsensi] = useState(false);

  // Sertifikat
  const [sertifikatList, setSertifikatList] = useState<SertifikatRecord[]>([]);
  const [loadingSertifikat, setLoadingSertifikat] = useState(false);
  const [sertifikatMsg, setSertifikatMsg] = useState({ type: '', text: '' });
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [showUploadModal, setShowUploadModal] = useState<number | null>(null);
  const [fileSertifikat, setFileSertifikat] = useState<File | null>(null);
  const [catatanAdmin, setCatatanAdmin] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pengaturan Jadwal
  const [jamMasuk, setJamMasuk] = useState('08:00');
  const [jamPulang, setJamPulang] = useState('17:00');
  const [loadingJadwal, setLoadingJadwal] = useState(false);
  const [savingJadwal, setSavingJadwal] = useState(false);
  const [jadwalMsg, setJadwalMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    if (activeMenu === 'dashboard') { fetchStats(); fetchPeserta(); fetchAbsensi(); }
    if (activeMenu === 'peserta') fetchPeserta();
    if (activeMenu === 'pendaftaran') fetchPeserta();
    if (activeMenu === 'absensi') fetchAbsensi();
    if (activeMenu === 'sertifikat') fetchSertifikat();
    if (activeMenu === 'jadwal') fetchJadwal();
  }, [activeMenu]);

  const fetchJadwal = async () => {
    setLoadingJadwal(true);
    setJadwalMsg({ type: '', text: '' });
    try {
      const res = await api.get('/jadwal');
      if (res.data?.data) {
        setJamMasuk(res.data.data.jam_masuk);
        setJamPulang(res.data.data.jam_pulang);
      }
    } catch (err: any) {
      console.error('Gagal memuat jadwal:', err);
    } finally {
      setLoadingJadwal(false);
    }
  };

  const handleUpdateJadwal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingJadwal(true);
    setJadwalMsg({ type: '', text: '' });
    try {
      const res = await api.put('/admin/jadwal', {
        jam_masuk: jamMasuk,
        jam_pulang: jamPulang,
      });
      setJadwalMsg({ type: 'success', text: 'Jadwal absensi berhasil diperbarui.' });
      if (res.data?.data) {
        setJamMasuk(res.data.data.jam_masuk);
        setJamPulang(res.data.data.jam_pulang);
      }
    } catch (err: any) {
      setJadwalMsg({
        type: 'error',
        text: err.response?.data?.message || 'Gagal memperbarui jadwal absensi.',
      });
    } finally {
      setSavingJadwal(false);
    }
  };

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
      const [resPeserta, resPendaftaran] = await Promise.all([
        api.get('/peserta'),
        api.get('/pendaftaran')
      ]);

      const pendaftaranMap = new Map();
      (resPendaftaran.data?.data || []).forEach((p: any) => {
        pendaftaranMap.set(p.id_user, p);
      });

      const list = (resPeserta.data?.data || []).map((peserta: any) => ({
        ...peserta,
        pendaftaran: pendaftaranMap.get(peserta.id_user)
      }));

      setPesertaList(list);
    } catch {
      setPesertaList([]);
    } finally {
      setLoadingPeserta(false);
    }
  };

  const fetchAbsensi = async () => {
    setLoadingAbsensi(true);
    try {
      const res = await api.get('/absensi/history');
      setAbsensiList(res.data.data || []);
    } catch { setAbsensiList([]); }
    finally { setLoadingAbsensi(false); }
  };

  const fetchSertifikat = async () => {
    setLoadingSertifikat(true);
    try {
      const res = await api.get('/sertifikat');
      setSertifikatList(res.data.data || []);
    } catch { setSertifikatList([]); }
    finally { setLoadingSertifikat(false); }
  };

  const handleKirimSertifikat = async (id: number) => {
    if (!fileSertifikat) { setSertifikatMsg({ type: 'error', text: 'Pilih file PDF sertifikat terlebih dahulu!' }); return; }
    setUploadingId(id);
    setSertifikatMsg({ type: '', text: '' });
    try {
      const fd = new FormData();
      fd.append('status', 'diberikan');
      fd.append('file_sertifikat', fileSertifikat);
      if (catatanAdmin.trim()) fd.append('catatan', catatanAdmin.trim());
      await api.post(`/sertifikat/${id}/verifikasi`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSertifikatMsg({ type: 'success', text: 'Sertifikat berhasil dikirim ke peserta!' });
      setShowUploadModal(null);
      setFileSertifikat(null);
      setCatatanAdmin('');
      fetchSertifikat();
    } catch (err: any) {
      setSertifikatMsg({ type: 'error', text: err.response?.data?.message || 'Gagal mengirim sertifikat.' });
    } finally { setUploadingId(null); }
  };

  const handleTolakSertifikat = async (id: number) => {
    if (!confirm('Yakin ingin menolak permintaan sertifikat ini?')) return;
    setUploadingId(id);
    setSertifikatMsg({ type: '', text: '' });
    try {
      const fd = new FormData();
      fd.append('status', 'ditolak');
      await api.post(`/sertifikat/${id}/verifikasi`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSertifikatMsg({ type: 'success', text: 'Permintaan sertifikat ditolak.' });
      fetchSertifikat();
    } catch (err: any) {
      setSertifikatMsg({ type: 'error', text: err.response?.data?.message || 'Gagal menolak permintaan.' });
    } finally { setUploadingId(null); }
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

  const updatePesertaStatus = async (id: number, status: 'diterima' | 'ditolak') => {
    const requests = [
      () => api.put(`/peserta/${id}`, { status_pkl: status }),
      () => api.patch(`/peserta/${id}`, { status_pkl: status }),
      () => api.put(`/peserta/${id}/status`, { status_pkl: status }),
      () => api.put(`/peserta/${id}/verifikasi`, { status_pkl: status, status }),
    ];

    let lastError: any;

    for (const request of requests) {
      try {
        await request();
        return;
      } catch (error: any) {
        lastError = error;
        if ([401, 403].includes(error.response?.status)) break;
      }
    }

    throw lastError;
  };

  const handleVerifikasiPeserta = async (id: number, status: 'diterima' | 'ditolak') => {
    const actionText = status === 'diterima' ? 'menerima' : 'menolak';
    if (!confirm(`Yakin ingin ${actionText} peserta ini?`)) return;

    setProcessingPesertaId(id);
    setVerifikasiMsg({ type: '', text: '' });

    try {
      await updatePesertaStatus(id, status);
      setPesertaList((list) => list.map((item) => (
        item.id_peserta === id ? { ...item, status_pkl: status } : item
      )));
      setVerifikasiMsg({ type: 'success', text: `Peserta berhasil ${status}.` });
      fetchStats();
    } catch (err: any) {
      setVerifikasiMsg({
        type: 'error',
        text: err.response?.data?.message || 'Gagal memproses status peserta. Pastikan backend menyediakan endpoint update status peserta.',
      });
    } finally {
      setProcessingPesertaId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleMenuClick = (id: string) => {
    setActiveMenu(id);
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
      setMobileOverlay(false);
    }
  };

  const toggleSidebar = () => {
    const newOpen = !sidebarOpen;
    setSidebarOpen(newOpen);
    if (window.innerWidth <= 768) {
      setMobileOverlay(newOpen);
    }
  };

  const formatDateStr = (s: string) => { try { return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return s; } };
  const formatTimeStr = (s?: string) => { if (!s) return '-'; try { const d = new Date(s); return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }); } catch { return s; } };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
    { id: 'peserta', label: 'Data Peserta', icon: 'users' },
    { id: 'absensi', label: 'Data Absensi', icon: 'clock' },
    { id: 'pendaftaran', label: 'Pendaftaran', icon: 'file' },
    { id: 'laporan', label: 'Laporan', icon: 'file' },
    { id: 'sertifikat', label: 'Sertifikat', icon: 'award' },
    { id: 'jadwal', label: 'Pengaturan Jadwal', icon: 'settings' },
  ];

  const getIcon = (icon: string) => {
    const icons: Record<string, JSX.Element> = {
      grid: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
      users: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
      clock: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
      file: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
      award: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
      settings: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 005 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
    };
    return icons[icon] || null;
  };

  const getMenuTitle = () => {
    if (activeMenu === 'peserta') return 'Data Peserta';
    if (activeMenu === 'absensi') return 'Data Absensi';
    if (activeMenu === 'pendaftaran') return 'Verifikasi Pendaftaran';
    if (activeMenu === 'laporan') return 'Laporan Absensi';
    if (activeMenu === 'sertifikat') return 'Manajemen Sertifikat';
    if (activeMenu === 'jadwal') return 'Pengaturan Jadwal Absensi';
    return 'Dashboard Admin';
  };

  const renderBerkasLinks = (p: Peserta) => {
    if (!p.pendaftaran) return <span style={{ color: '#8a8a9e', fontSize: '0.8rem' }}>Belum upload</span>;
    const { file_surat, file_cv, file_surat_lamaran } = p.pendaftaran;
    const baseUrl = 'http://localhost:8080/uploads';
    
    return (
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        {file_surat && (
          <a
            href={`${baseUrl}/${file_surat}`}
            target="_blank"
            rel="noopener noreferrer"
            className="status-badge"
            style={{ background: '#e0f2fe', color: '#0369a1', textDecoration: 'none', fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.5rem' }}
            title="Surat Pengantar"
          >
            Surat
          </a>
        )}
        {file_cv && (
          <a
            href={`${baseUrl}/${file_cv}`}
            target="_blank"
            rel="noopener noreferrer"
            className="status-badge"
            style={{ background: '#f3e8ff', color: '#6b21a8', textDecoration: 'none', fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.5rem' }}
            title="Curriculum Vitae (CV)"
          >
            CV
          </a>
        )}
        {file_surat_lamaran && (
          <a
            href={`${baseUrl}/${file_surat_lamaran}`}
            target="_blank"
            rel="noopener noreferrer"
            className="status-badge"
            style={{ background: '#fef3c7', color: '#92400e', textDecoration: 'none', fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.5rem' }}
            title="Surat Lamaran"
          >
            Lamaran
          </a>
        )}
      </div>
    );
  };

  const pendingPeserta = pesertaList.filter((p) => p.status_pkl?.toLowerCase() === 'pending');

  return (
    <div className="dashboard-layout">
      {/* Mobile Overlay */}
      {mobileOverlay && (
        <div className="sidebar-overlay" onClick={() => { setSidebarOpen(false); setMobileOverlay(false); }} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar sidebar-admin ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon" style={{ background: 'transparent', padding: '2px' }}>
              <img src="/images/logo-bpti.png" alt="BPTI Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            {sidebarOpen && <div className="sidebar-brand-text"><span className="sidebar-brand-name">Admin</span><span className="sidebar-brand-sub">BPTI UHAMKA</span></div>}
          </div>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button key={item.id} className={`sidebar-nav-item ${activeMenu === item.id ? 'active' : ''}`} onClick={() => handleMenuClick(item.id)} title={item.label}>
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
          <button className="topbar-toggle" onClick={toggleSidebar} aria-label="Toggle menu">
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
                  <p>Kelola peserta PKL, pantau absensi, dan buka laporan.</p>
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
                    <div className="dash-stat-info"><div className="dash-stat-value" style={{ color: '#ef4444' }}>{pendingPeserta.length}</div><div className="dash-stat-label">Pending Daftar</div></div>
                  </div>
                </div>
              )}

              <div className="admin-quick-grid">
                <div className="dash-table-card" style={{ cursor: 'pointer' }} onClick={() => handleMenuClick('peserta')}>
                  <div className="dash-table-header"><h3>Data Peserta</h3><span className="dash-table-link">Kelola →</span></div>
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: '#5a5a6e' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1a5c38' }}>{stats?.total_peserta || 0}</div>
                    <div style={{ fontSize: '0.85rem' }}>Peserta terdaftar</div>
                  </div>
                </div>
                <div className="dash-table-card" style={{ cursor: 'pointer' }} onClick={() => handleMenuClick('pendaftaran')}>
                  <div className="dash-table-header"><h3>Pendaftaran</h3><span className="dash-table-link">Verifikasi →</span></div>
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: '#5a5a6e' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#ef4444' }}>{pendingPeserta.length}</div>
                    <div style={{ fontSize: '0.85rem' }}>Menunggu keputusan admin</div>
                  </div>
                </div>
              </div>

              {/* Grafik ApexCharts */}
              <div className="dash-table-card" style={{ marginTop: '30px' }}>
                <div className="dash-table-header">
                  <h3>Statistik Kehadiran Keseluruhan</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  {loadingAbsensi ? (
                    <div style={{ textAlign: 'center', color: '#8a8a9e', padding: '2rem' }}>Memuat grafik...</div>
                  ) : (
                    <Chart
                      options={{
                        chart: { type: 'bar', toolbar: { show: false } },
                        colors: ['#10b981', '#f59e0b', '#ef4444'],
                        plotOptions: { bar: { columnWidth: '45%', borderRadius: 4, distributed: true } },
                        dataLabels: { enabled: true },
                        legend: { show: false },
                        xaxis: {
                          categories: ['Hadir', 'Telat', 'Tidak Hadir'],
                          labels: { style: { colors: ['#10b981', '#f59e0b', '#ef4444'], fontSize: '14px', fontWeight: 600 } }
                        },
                      }}
                      series={[{
                        name: 'Total',
                        data: [
                          absensiList.filter(a => a.status.toLowerCase().includes('hadir') && !a.status.toLowerCase().includes('tidak')).length,
                          absensiList.filter(a => a.status.toLowerCase().includes('telat')).length,
                          absensiList.filter(a => a.status.toLowerCase().includes('tidak hadir') || a.status.toLowerCase().includes('alpha')).length
                        ]
                      }]}
                      type="bar"
                      height={350}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ======= DATA PESERTA ======= */}
          {activeMenu === 'peserta' && (
            <div className="dashboard-home">
              {verifikasiMsg.text && (
                <div className={`dashboard-alert dashboard-alert-${verifikasiMsg.type}`}>{verifikasiMsg.text}</div>
              )}
              <div className="dash-table-card">
                <div className="dash-table-header">
                  <h3>Daftar Peserta PKL ({pesertaList.length})</h3>
                </div>
                <div className="dash-table-wrapper">
                  {loadingPeserta ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#8a8a9e' }}>Memuat data...</div>
                  ) : (
                    <table className="dash-table">
                      <thead><tr><th>No</th><th>Nama</th><th>NIM/NIS</th><th>Asal Instansi</th><th>Jurusan</th><th>No HP</th><th>Berkas</th><th>Status</th><th>Aksi</th></tr></thead>
                      <tbody>
                        {pesertaList.map((p, i) => (
                          <tr key={p.id_peserta}>
                            <td>{i + 1}</td>
                            <td style={{ fontWeight: 600 }}>{p.user?.nama || '-'}</td>
                            <td>{p.nim_nis}</td>
                            <td>{p.asal_instansi}</td>
                            <td>{p.jurusan}</td>
                            <td>{p.no_hp || '-'}</td>
                            <td>{renderBerkasLinks(p)}</td>
                            <td><span className={`status-badge status-${p.status_pkl?.toLowerCase()}`}>{p.status_pkl}</span></td>
                            <td>
                              <div className="table-actions">
                                {p.status_pkl?.toLowerCase() === 'pending' && (
                                  <>
                                    <button onClick={() => handleVerifikasiPeserta(p.id_peserta, 'diterima')} className="btn-action-accept" title="Terima" disabled={processingPesertaId === p.id_peserta}>
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                                    </button>
                                    <button onClick={() => handleVerifikasiPeserta(p.id_peserta, 'ditolak')} className="btn-action-reject" title="Tolak" disabled={processingPesertaId === p.id_peserta}>
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                    </button>
                                  </>
                                )}
                                <button onClick={() => handleDeletePeserta(p.id_peserta)} className="btn-action-delete" title="Hapus">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {pesertaList.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', color: '#8a8a9e' }}>Belum ada data peserta</td></tr>}
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
                <div className={`dashboard-alert dashboard-alert-${verifikasiMsg.type}`}>{verifikasiMsg.text}</div>
              )}
              <div className="dash-table-card">
                <div className="dash-table-header">
                  <h3>Menunggu Verifikasi ({pendingPeserta.length})</h3>
                </div>
                <div className="dash-table-wrapper">
                  {loadingPeserta ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#8a8a9e' }}>Memuat data...</div>
                  ) : (
                    <table className="dash-table">
                      <thead><tr><th>No</th><th>Nama</th><th>Email</th><th>NIM/NIS</th><th>Asal Instansi</th><th>Jurusan</th><th>Berkas</th><th>Status</th><th>Aksi</th></tr></thead>
                      <tbody>
                        {pendingPeserta.map((p, i) => (
                          <tr key={p.id_peserta}>
                            <td>{i + 1}</td>
                            <td style={{ fontWeight: 600 }}>{p.user?.nama || '-'}</td>
                            <td>{p.user?.email || '-'}</td>
                            <td>{p.nim_nis}</td>
                            <td>{p.asal_instansi}</td>
                            <td>{p.jurusan}</td>
                            <td>{renderBerkasLinks(p)}</td>
                            <td><span className={`status-badge status-${p.status_pkl?.toLowerCase()}`}>{p.status_pkl}</span></td>
                            <td>
                              <div className="table-actions">
                                <button onClick={() => handleVerifikasiPeserta(p.id_peserta, 'diterima')} className="btn-action-accept" title="Terima" disabled={processingPesertaId === p.id_peserta}>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                                </button>
                                <button onClick={() => handleVerifikasiPeserta(p.id_peserta, 'ditolak')} className="btn-action-reject" title="Tolak" disabled={processingPesertaId === p.id_peserta}>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {pendingPeserta.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', color: '#8a8a9e' }}>Tidak ada pendaftaran yang menunggu verifikasi</td></tr>}
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

          {activeMenu === 'laporan' && <LaporanAbsensi />}

          {/* ======= SERTIFIKAT (ADMIN) ======= */}
          {activeMenu === 'sertifikat' && (
            <div className="dashboard-home">
              {sertifikatMsg.text && (
                <div className={`dashboard-alert dashboard-alert-${sertifikatMsg.type}`} style={{ marginBottom: '1rem' }}>{sertifikatMsg.text}</div>
              )}

              {/* Upload Modal */}
              {showUploadModal !== null && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                  <div style={{ background: '#fff', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                    <h3 style={{ color: '#0f3d24', marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 700 }}>📄 Kirim Sertifikat PDF</h3>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label className="form-label">File Sertifikat (PDF) *</label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/pdf"
                        onChange={e => setFileSertifikat(e.target.files?.[0] || null)}
                        style={{ display: 'block', width: '100%', fontSize: '0.88rem', padding: '0.5rem', border: '1.5px solid #e2e8f0', borderRadius: '8px' }}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label className="form-label">Catatan (opsional)</label>
                      <textarea
                        value={catatanAdmin}
                        onChange={e => setCatatanAdmin(e.target.value)}
                        placeholder="Catatan untuk peserta..."
                        rows={3}
                        style={{ width: '100%', padding: '0.75rem', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '0.88rem', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => { setShowUploadModal(null); setFileSertifikat(null); setCatatanAdmin(''); setSertifikatMsg({ type: '', text: '' }); }}
                        style={{ padding: '0.6rem 1.2rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#5a5a6e' }}
                      >Batal</button>
                      <button
                        onClick={() => handleKirimSertifikat(showUploadModal)}
                        disabled={uploadingId === showUploadModal}
                        style={{ padding: '0.6rem 1.4rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #1a5c38, #2d8a56)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        {uploadingId === showUploadModal ? '⌛ Mengirim...' : '📤 Kirim Sertifikat'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="dash-table-card">
                <div className="dash-table-header">
                  <h3>Permintaan Sertifikat ({sertifikatList.length})</h3>
                  <button
                    onClick={fetchSertifikat}
                    style={{ background: 'none', border: '1.5px solid #1a5c38', color: '#1a5c38', borderRadius: '8px', padding: '0.35rem 0.9rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}
                  >🔄 Refresh</button>
                </div>
                <div className="dash-table-wrapper">
                  {loadingSertifikat ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#8a8a9e' }}>Memuat data...</div>
                  ) : (
                    <table className="dash-table">
                      <thead>
                        <tr>
                          <th>No</th>
                          <th>Nama Peserta</th>
                          <th>NIM/NIS</th>
                          <th>Tanggal Request</th>
                          <th>Catatan</th>
                          <th>Status</th>
                          <th>File</th>
                          <th>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sertifikatList.map((s, i) => (
                          <tr key={s.id_sertifikat}>
                            <td>{i + 1}</td>
                            <td style={{ fontWeight: 600 }}>{s.peserta?.user?.nama || s.user?.nama || '-'}</td>
                            <td>{s.peserta?.nim_nis || '-'}</td>
                            <td>{formatDateStr(s.tanggal_request)}</td>
                            <td style={{ maxWidth: '180px', fontSize: '0.82rem', color: '#5a5a6e' }}>{s.catatan || '-'}</td>
                            <td>
                              <span className={`status-badge status-${s.status}`} style={{
                                background: s.status === 'diberikan' ? '#d1fae5' : s.status === 'ditolak' ? '#fee2e2' : '#fef3c7',
                                color: s.status === 'diberikan' ? '#065f46' : s.status === 'ditolak' ? '#dc2626' : '#d97706',
                              }}>{s.status}</span>
                            </td>
                            <td>
                              {s.file_sertifikat ? (
                                <a
                                  href={`http://localhost:8080/uploads/${s.file_sertifikat}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="status-badge"
                                  style={{ background: '#dbeafe', color: '#1d4ed8', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 600 }}
                                >📥 Lihat PDF</a>
                              ) : <span style={{ color: '#8a8a9e', fontSize: '0.8rem' }}>-</span>}
                            </td>
                            <td>
                              {s.status === 'pending' && (
                                <div className="table-actions">
                                  <button
                                    onClick={() => { setSertifikatMsg({ type: '', text: '' }); setShowUploadModal(s.id_sertifikat); setFileSertifikat(null); setCatatanAdmin(''); }}
                                    className="btn-action-accept"
                                    title="Kirim Sertifikat PDF"
                                    disabled={uploadingId === s.id_sertifikat}
                                  >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                  </button>
                                  <button
                                    onClick={() => handleTolakSertifikat(s.id_sertifikat)}
                                    className="btn-action-reject"
                                    title="Tolak Permintaan"
                                    disabled={uploadingId === s.id_sertifikat}
                                  >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                  </button>
                                </div>
                              )}
                              {s.status !== 'pending' && <span style={{ color: '#8a8a9e', fontSize: '0.8rem' }}>Selesai</span>}
                            </td>
                          </tr>
                        ))}
                        {sertifikatList.length === 0 && (
                          <tr><td colSpan={8} style={{ textAlign: 'center', color: '#8a8a9e', padding: '2rem' }}>Belum ada permintaan sertifikat</td></tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ======= PENGATURAN JADWAL ======= */}
          {activeMenu === 'jadwal' && (
            <div className="dashboard-home">
              <div className="dash-table-card" style={{ maxWidth: '600px', margin: '0 auto', padding: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                  <div className="dash-stat-icon" style={{ background: '#ecfdf5', color: '#10b981', margin: 0, padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '12px' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 005 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
                  </div>
                  <div>
                    <h3 style={{ color: '#0f3d24', fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Pengaturan Jadwal Absensi</h3>
                    <p style={{ color: '#5a5a6e', fontSize: '0.88rem', margin: '4px 0 0 0' }}>Atur batasan jam absen masuk dan jam absen pulang untuk peserta PKL.</p>
                  </div>
                </div>

                {jadwalMsg.text && (
                  <div className={`auth-${jadwalMsg.type} animate-fade-in`} style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.2rem', borderRadius: '12px', fontSize: '0.88rem', background: jadwalMsg.type === 'error' ? '#fef2f2' : '#f0fdf4', border: `1px solid ${jadwalMsg.type === 'error' ? '#fecaca' : '#bbf7d0'}`, color: jadwalMsg.type === 'error' ? '#dc2626' : '#16a34a' }}>
                    <span>{jadwalMsg.text}</span>
                  </div>
                )}

                {loadingJadwal ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#8a8a9e', fontWeight: 600 }}>Memuat jadwal...</div>
                ) : (
                  <form onSubmit={handleUpdateJadwal} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label className="form-label" style={{ fontWeight: 600, color: '#0f3d24' }}>Jam Masuk (Batas Telat)</label>
                      <input
                        type="time"
                        className="form-input"
                        value={jamMasuk}
                        onChange={(e) => setJamMasuk(e.target.value)}
                        required
                        style={{ padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '1rem', width: '100%', boxSizing: 'border-box' }}
                      />
                      <small style={{ color: '#8a8a9e', display: 'block', marginTop: '4px' }}>Peserta yang absen masuk setelah jam ini akan otomatis berstatus <strong>Telat</strong>.</small>
                    </div>

                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label className="form-label" style={{ fontWeight: 600, color: '#0f3d24' }}>Jam Pulang (Minimal Absen Pulang)</label>
                      <input
                        type="time"
                        className="form-input"
                        value={jamPulang}
                        onChange={(e) => setJamPulang(e.target.value)}
                        required
                        style={{ padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '1rem', width: '100%', boxSizing: 'border-box' }}
                      />
                      <small style={{ color: '#8a8a9e', display: 'block', marginTop: '4px' }}>Peserta tidak diizinkan melakukan absen pulang sebelum jam yang ditentukan.</small>
                    </div>

                    <button
                      type="submit"
                      disabled={savingJadwal}
                      style={{
                        background: '#1a5c38',
                        color: '#fff',
                        border: 'none',
                        padding: '1rem',
                        borderRadius: '12px',
                        fontWeight: 700,
                        fontSize: '1rem',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        marginTop: '1rem',
                        boxShadow: '0 4px 12px rgba(26,92,56,0.15)',
                      }}
                    >
                      {savingJadwal ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
