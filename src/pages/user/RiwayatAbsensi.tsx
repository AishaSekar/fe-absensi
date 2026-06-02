import React from "react";
import '../../css/RiwayatAbsensi.css';
import {
  ArrowLeft,
  CalendarDays,
  Calendar,
  Filter,
} from "lucide-react";


const dataAbsensi = [
  { tanggal: "Sel, 19 Mei 2026", masuk: "08:15", pulang: "16:30", status: "Hadir" },
  { tanggal: "Sab, 16 Mei 2026", masuk: "08:05", pulang: "16:25", status: "Hadir" },
  { tanggal: "Jum, 15 Mei 2026", masuk: "08:35", pulang: "16:40", status: "Telat" },
  { tanggal: "Kam, 14 Mei 2026", masuk: "08:10", pulang: "16:20", status: "Hadir" },
  { tanggal: "Rab, 13 Mei 2026", masuk: "-", pulang: "-", status: "Alpha" },
  { tanggal: "Sel, 12 Mei 2026", masuk: "08:20", pulang: "16:35", status: "Hadir" },
  { tanggal: "Sab, 9 Mei 2026", masuk: "08:00", pulang: "16:15", status: "Hadir" },
  { tanggal: "Jum, 8 Mei 2026", masuk: "08:25", pulang: "16:30", status: "Hadir" },
  { tanggal: "Kam, 7 Mei 2026", masuk: "08:10", pulang: "16:20", status: "Hadir" },
  { tanggal: "Rab, 6 Mei 2026", masuk: "08:40", pulang: "16:45", status: "Telat" },
];

export default function RiwayatAbsensi() {
  return (
    <div className="page">
      <header className="topbar">
        <div className="header-content">
          <button className="back-btn">
            <ArrowLeft size={26} />
          </button>

          <div>
            <h1>Riwayat Absensi</h1>
            <p>Lihat semua riwayat kehadiran</p>
          </div>
        </div>
      </header>

      <main className="container">
        <section className="stats-grid">
          <div className="stat-card">
            <span>Total Hari</span>
            <strong>46</strong>
          </div>

          <div className="stat-card">
            <span>Hadir</span>
            <strong>42</strong>
          </div>

          <div className="stat-card">
            <span>Telat</span>
            <strong className="green">3</strong>
          </div>

          <div className="stat-card">
            <span>Alpha</span>
            <strong className="red">1</strong>
          </div>
        </section>

        <section className="detail-card">
          <div className="detail-header">
            <h2>Detail Kehadiran</h2>

            <div className="filter-area">
              <button className="filter-btn">
                <Filter size={25} />
              </button>

              <button className="month-btn">
                <span>May 2026</span>
                <Calendar size={20} />
              </button>
            </div>
          </div>

          <div className="table">
            <div className="table-head">
              <div>Tanggal</div>
              <div>Jam Masuk</div>
              <div>Jam Pulang</div>
              <div>Status</div>
            </div>

            {dataAbsensi.map((item, index) => (
              <div
                className={`table-row ${item.status === "Alpha" ? "alpha-row" : ""}`}
                key={index}
              >
                <div className="date-cell">
                  <CalendarDays size={21} />
                  <span>{item.tanggal}</span>
                </div>

                <div>{item.masuk}</div>
                <div>{item.pulang}</div>

                <div>
                  <span className={`badge ${item.status.toLowerCase()}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}