import { useMemo, useState } from "react";
import '../../css/Absensi.css';

const attendanceData = [
  {
    id: 1,
    name: "Ahmad Fauzi",
    number: "2021001234",
    institution: "UHAMKA",
    checkIn: "08:15",
    checkOut: "16:30",
    status: "Hadir",
  },
  {
    id: 2,
    name: "Siti Nurhaliza",
    number: "2021001235",
    institution: "SMK N 1",
    checkIn: "08:35",
    checkOut: "16:40",
    status: "Telat",
  },
  {
    id: 3,
    name: "Budi Santoso",
    number: "2021001236",
    institution: "UHAMKA",
    checkIn: "08:10",
    checkOut: "16:20",
    status: "Hadir",
  },
  {
    id: 4,
    name: "Dewi Lestari",
    number: "2021001237",
    institution: "SMK N 2",
    checkIn: "-",
    checkOut: "-",
    status: "Alpha",
  },
  {
    id: 5,
    name: "Eko Prasetyo",
    number: "2021001238",
    institution: "UHAMKA",
    checkIn: "08:05",
    checkOut: "16:25",
    status: "Hadir",
  },
];

const statusClass = {
  Hadir: "present",
  Telat: "late",
  Alpha: "absent",
};

function ArrowLeftIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M19 12H5m7-7-7 7 7 7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="m16.5 16.5 4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 3v4M17 3v4M4 9h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function SummaryCard({ label, value, variant }) {
  return (
    <article className={`summary-card ${variant}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function formatDate(value) {
  if (!value) return "";
  const [year, month, date] = value.split("-");
  return `${month}/${date}/${year}`;
}

function App() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Semua Status");
  const [date, setDate] = useState("2026-05-19");

  const summary = useMemo(() => {
    return attendanceData.reduce(
      (result, item) => {
        result.total += 1;
        result[item.status] += 1;
        return result;
      },
      { total: 0, Hadir: 0, Telat: 0, Alpha: 0 }
    );
  }, []);

  const filteredAttendance = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return attendanceData.filter((item) => {
      const matchesStatus = status === "Semua Status" || item.status === status;
      const searchableText = [item.name, item.number, item.institution]
        .join(" ")
        .toLowerCase();

      return matchesStatus && searchableText.includes(keyword);
    });
  }, [search, status]);

  return (
    <div className="page">
      <header className="app-bar">
        <button className="back-button" aria-label="Kembali">
          <ArrowLeftIcon />
        </button>

        <div className="title-wrap">
          <h1>Data Absensi</h1>
          <p>Lihat dan kelola absensi peserta</p>
        </div>
      </header>

      <main className="content">
        <section className="summary-grid" aria-label="Ringkasan absensi">
          <SummaryCard label="Total" value={summary.total} variant="total" />
          <SummaryCard label="Hadir" value={summary.Hadir} variant="present-card" />
          <SummaryCard label="Telat" value={summary.Telat} variant="late-card" />
          <SummaryCard label="Alpha" value={summary.Alpha} variant="absent-card" />
        </section>

        <section className="panel" aria-label="Data absensi peserta">
          <div className="toolbar">
            <label className="search-field">
              <span className="sr-only">Cari peserta</span>
              <SearchIcon />
              <input
                type="search"
                placeholder="Cari nama, NIM/NIS, atau institusi..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <label className="date-field">
              <span className="sr-only">Tanggal absensi</span>
              <CalendarIcon />
              <span>{formatDate(date)}</span>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>

            <label>
              <span className="sr-only">Filter status</span>
              <select
                className="status-select"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option>Semua Status</option>
                <option>Hadir</option>
                <option>Telat</option>
                <option>Alpha</option>
              </select>
            </label>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>NIM/NIS</th>
                  <th>Institusi</th>
                  <th>Jam Masuk</th>
                  <th>Jam Pulang</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredAttendance.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.number}</td>
                    <td>{item.institution}</td>
                    <td>{item.checkIn}</td>
                    <td>{item.checkOut}</td>
                    <td>
                      <span className={`badge ${statusClass[item.status]}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {filteredAttendance.length === 0 && (
                  <tr>
                    <td className="empty-state" colSpan="6">
                      Data absensi tidak ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <div className="help" aria-hidden="true">?</div>
    </div>
  );
}

export default App;