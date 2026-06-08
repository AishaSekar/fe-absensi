import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../css/LandingPage.css';

const sliderImages = [
  '/images/fkip.png',
  '/images/gedung.png',
  '/images/siber.png',
  '/images/keren.png',
];

function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-slide every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.scroll-animate').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-page">
      {/* ===== NAVBAR ===== */}
      <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
        <div className="navbar-container">
          <Link to="/" className="navbar-brand">
            <div className="brand-icon brand-icon-logo">
              <img src="/images/logo.png" alt="Logo BPTI UHAMKA" className="brand-logo-img" />
            </div>
            <div className="brand-text">
              <span className="brand-name">BPTI UHAMKA</span>
              <span className="brand-sub">Sistem Absensi PKL</span>
            </div>
          </Link>

          <div className="navbar-links-desktop">
            <a href="#beranda" className="nav-link">Beranda</a>
            <a href="#tentang" className="nav-link">Tentang</a>
            <a href="#kontak" className="nav-link">Kontak</a>
          </div>

          <Link to="/login" className="btn-masuk-nav">
            Masuk
          </Link>

          <button 
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileMenuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <>
                  <path d="M3 6h18M3 12h18M3 18h18" />
                </>
              )}
            </svg>
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="mobile-menu">
            <a href="#beranda" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Beranda</a>
            <a href="#tentang" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Tentang</a>
            <a href="#kontak" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Kontak</a>
            <Link to="/login" className="mobile-link-btn" onClick={() => setMobileMenuOpen(false)}>Masuk</Link>
          </div>
        )}
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section className="hero-section" id="beranda">
        {/* Background Slider */}
        <div className="hero-slider">
          {sliderImages.map((img, index) => (
            <div
              key={index}
              className={`hero-slide ${index === currentSlide ? 'hero-slide-active' : ''}`}
              style={{ backgroundImage: `url(${img})` }}
            />
          ))}
          <div className="hero-slider-overlay" />
        </div>

        {/* Slider Dots */}
        <div className="hero-slider-dots">
          {sliderImages.map((_, index) => (
            <button
              key={index}
              className={`hero-slider-dot ${index === currentSlide ? 'hero-slider-dot-active' : ''}`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>

        <div className="hero-bg-pattern"></div>
        <div className="hero-container">
          <div className="hero-content animate-slide-left">
            <div className="hero-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              </svg>
              <center>
                Terakreditasi Unggul</center>
            </div>
            <h1 className="hero-title">
              Praktik Kerja Lapangan di <span className="hero-highlight">BPTI UHAMKA</span>
            </h1>
            <p className="hero-description">
              Kembangkan keterampilan profesional Anda bersama Biro Pengembangan
              Teknologi Informasi Universitas Muhammadiyah Prof. DR. HAMKA.
              Bergabunglah dengan program PKL yang terstruktur dan didukung
              teknologi modern.
            </p>
            <div className="hero-buttons">
              <Link to="/register" className="btn-primary">
                <span>Mulai Pendaftaran</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <Link to="/login" className="btn-secondary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
                </svg>
                <span>Login Peserta</span>
              </Link>
            </div>
          </div>
          <div className="hero-image-wrapper animate-slide-right">
            <div className="hero-image-glow"></div>
            <img
              src={sliderImages[currentSlide]}
              alt="Kampus UHAMKA"
              className="hero-image hero-image-slide"
            />
            <div className="hero-image-decoration"></div>
          </div>
        </div>
      </section>

      {/* ===== STATS SECTION ===== */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-card scroll-animate">
            <div className="stat-icon stat-icon-blue">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
            <div className="stat-number">500+</div>
            <div className="stat-label">Peserta PKL</div>
          </div>
          <div className="stat-card scroll-animate">
            <div className="stat-icon stat-icon-green">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
              </svg>
            </div>
            <div className="stat-number">100%</div>
            <div className="stat-label">Absensi Digital</div>
          </div>
          <div className="stat-card scroll-animate">
            <div className="stat-icon stat-icon-purple">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className="stat-number">50+</div>
            <div className="stat-label">Proyek Selesai</div>
          </div>
          <div className="stat-card scroll-animate">
            <div className="stat-icon stat-icon-orange">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="stat-number">10+</div>
            <div className="stat-label">Tahun Pengalaman</div>
          </div>
        </div>
      </section>

      {/* ===== ABOUT SECTION ===== */}
      <section className="about-section" id="tentang">
        <div className="about-container">
          <div className="about-image-wrapper scroll-animate">
            <img
              src="/images/gedung.png"
              alt="Gedung BPTI UHAMKA"
              className="about-image"
            />
            <div className="about-image-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>Terpercaya</span>
            </div>
          </div>
          <div className="about-content scroll-animate">
            <div className="section-label">Tentang Program</div>
            <h2 className="section-title">Mengapa PKL di BPTI UHAMKA?</h2>
            <p className="section-desc">
              BPTI UHAMKA menyediakan program Praktik Kerja Lapangan yang 
              komprehensif dengan pendampingan profesional dan fasilitas modern.
            </p>
            <div className="feature-list">
              <div className="feature-item">
                <div className="feature-check">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span>Pengalaman langsung dengan proyek nyata di bidang IT</span>
              </div>
              <div className="feature-item">
                <div className="feature-check">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span>Bimbingan dari profesional berpengalaman</span>
              </div>
              <div className="feature-item">
                <div className="feature-check">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span>Fasilitas lengkap dan modern</span>
              </div>
              <div className="feature-item">
                <div className="feature-check">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span>Sertifikat resmi setelah menyelesaikan program</span>
              </div>
            </div>
            <Link to="/register" className="btn-primary" style={{ marginTop: '1.5rem' }}>
              <span>Mulai Pendaftaran</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== CONTACT SECTION ===== */}
      <section className="contact-section" id="kontak">
        <div className="contact-container">
          <div className="contact-info scroll-animate">
            <div className="section-label">Hubungi Kami</div>
            <h2 className="section-title" style={{ color: '#fff' }}>Butuh Informasi Lebih?</h2>
            <p className="section-desc" style={{ color: 'rgba(255,255,255,0.8)' }}>
              Jangan ragu untuk menghubungi kami jika Anda memiliki pertanyaan
              tentang program PKL di BPTI UHAMKA.
            </p>
          </div>
          <div className="contact-cards scroll-animate">
            <div className="contact-card">
              <div className="contact-card-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className="contact-card-content">
                <h4>Alamat</h4>
                <p>Jl. Tanah Merdeka No.20, RT.11/RW.2,Rambutan, Kec.Ciracas,Kota Jakarta Timur, DKI Jakarta 13830</p>
              </div>
            </div>
            <div className="contact-card">
              <div className="contact-card-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                </svg>
              </div>
              <div className="contact-card-content">
                <h4>Telepon</h4>
                <p>(021) 7395766</p>
              </div>
            </div>
            <div className="contact-card">
              <div className="contact-card-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 7l-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" />
                </svg>
              </div>
              <div className="contact-card-content">
                <h4>Email</h4>
                <p>bpti@uhamka.ac.id</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="footer-logo">
              <div className="brand-icon" style={{ background: 'rgba(255,255,255,0.15)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c0 1.1 2.7 2 6 2s6-.9 6-2v-5" />
                </svg>
              </div>
              <div>
                <span className="footer-brand-name">BPTI UHAMKA</span>
              </div>
            </div>
            <p className="footer-brand-desc">
              Biro Pengembangan Teknologi Informasi Universitas Muhammadiyah Prof. DR. HAMKA
            </p>
          </div>
          <div className="footer-links">
            <h4 className="footer-title">Link Cepat</h4>
            <Link to="/login" className="footer-link">Login</Link>
            <Link to="/register" className="footer-link">Pendaftaran PKL</Link>
            <a href="#tentang" className="footer-link">Tentang</a>
          </div>
          <div className="footer-contact">
            <h4 className="footer-title">Hubungi Kami</h4>
            <p className="footer-contact-item">Jl. Tanah Merdeka No.20, RT.11/RW.2,Rambutan, Kec.Ciracas,Kota Jakarta Timur, DKI Jakarta 13830</p>
            <p className="footer-contact-item">(021) 7395766</p>
            <p className="footer-contact-item">bpti@uhamka.ac.id</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} BPTI UHAMKA. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
