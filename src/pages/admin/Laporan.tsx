import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./LaporanAbsensi.css";

const institutions = ["Semua Institusi", "UHAMKA", "SMK N 1", "SMK N 2"];

const participants = [
  { name: "Ahmad Fauzi", institution: "UHAMKA", present: 42, late: 3, absent: 1 },
  { name: "Siti Nurhaliza", institution: "SMK N 1", present: 40, late: 5, absent: 1 },
  { name: "Budi Santoso", institution: "UHAMKA", present: 44, late: 2, absent: 0 },
  { name: "Rina Kartika", institution: "SMK N 2", present: 39, late: 4, absent: 3 },
  { name: "Dimas Pratama", institution: "SMK N 1", present: 41, late: 2, absent: 1 },
  { name: "Maya Lestari", institution: "UHAMKA", present: 43, late: 1, absent: 2 },
];

const dailyTrend = [
  { date: "05/13", total: 39 },
  { date: "05/14", total: 40 },
  { date: "05/15", total: 36 },
  { date: "05/16", total: 39 },
  { date: "05/19", total: 39 },
];

const COLORS = {
  present: "#207a66",
  late: "#2ca58d",
  absent: "#6fcf97",
  text: "#00645f",
};

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

function downloadCsv(filename, rows) {
  const csv = rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

function DateField({ label, value, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>

      <div className="date-control">
        <input type="date" value={value} onChange={onChange} />
        <CalendarDays size={18} aria-hidden="true" />
      </div>
    </label>
  );
}

function StatCard({ label, value, variant = "soft" }) {
  return (
    <div className={`stat-card ${variant}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function LaporanAbsensi() {
  const [startDate, setStartDate] = useState("2026-05-01");
  const [endDate, setEndDate] = useState("2026-05-19");
  const [institution, setInstitution] = useState("Semua Institusi");

  const filteredParticipants = useMemo(() => {
    if (institution === "Semua Institusi") return participants;

    return participants.filter((item) => item.institution === institution);
  }, [institution]);

  const totals = useMemo(() => {
    const summary = filteredParticipants.reduce(
      (acc, item) => {
        acc.present += item.present;
        acc.late += item.late;
        acc.absent += item.absent;
        return acc;
      },
      { present: 0, late: 0, absent: 0 }
    );

    const all = summary.present + summary.late + summary.absent;

    return {
      ...summary,
      all,
      active: 42,
      percentage: all ? (summary.present / all) * 100 : 0,
    };
  }, [filteredParticipants]);

  const statusData = [
    { name: "Hadir", value: totals.present, color: COLORS.present },
    { name: "Telat", value: totals.late, color: COLORS.late },
    { name: "Alpha", value: totals.absent, color: COLORS.absent },
  ];

  const institutionData = useMemo(() => {
    return institutions
      .filter((item) => item !== "Semua Institusi")
      .map((name) => {
        const list = participants.filter((item) => item.institution === name);

        return {
          institution: name,
          Hadir: list.reduce((sum, item) => sum + item.present, 0),
          Telat: list.reduce((sum, item) => sum + item.late, 0),
          Alpha: list.reduce((sum, item) => sum + item.absent, 0),
        };
      });
  }, []);

  const tableRows = filteredParticipants.map((item) => {
    const total = item.present + item.late + item.absent;

    return {
      ...item,
      percentage: total ? (item.present / total) * 100 : 0,
    };
  });

  const exportExcel = () => {
    downloadCsv("laporan-absensi.csv", [
      ["Nama", "Institusi", "Hadir", "Telat", "Alpha", "Persentase"],
      ...tableRows.map((item) => [
        item.name,
        item.institution,
        item.present,
        item.late,
        item.absent,
        `${item.percentage.toFixed(1)}%`,
      ]),
    ]);
  };

  return (
    <main className="attendance-page">
      <header className="topbar">
        <div className="topbar-inner">
          <button className="icon-button" aria-label="Kembali">
            <ArrowLeft size={28} />
          </button>

          <div>
            <h1>Laporan Absensi</h1>
            <p>Analisis dan ekspor data</p>
          </div>
        </div>
      </header>

      <div className="page-content">
        <section className="panel filter-panel">
          <h2>Filter Laporan</h2>

          <div className="filter-grid">
            <DateField
              label="Dari Tanggal"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />

            <DateField
              label="Sampai Tanggal"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />

            <label className="field">
              <span>Institusi</span>

              <div className="select-control">
                <select
                  value={institution}
                  onChange={(event) => setInstitution(event.target.value)}
                >
                  {institutions.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>

                <ChevronDown size={20} aria-hidden="true" />
              </div>
            </label>
          </div>

          <div className="action-row">
            <button className="export-button excel" onClick={exportExcel}>
              <FileSpreadsheet size={22} />
              Export ke Excel
            </button>

            <button className="export-button pdf" onClick={() => window.print()}>
              <FileText size={22} />
              Export ke PDF
            </button>
          </div>
        </section>

        <section className="chart-grid">
          <article className="panel chart-card">
            <h2>Distribusi Status Kehadiran</h2>

            <div className="pie-layout">
              <ResponsiveContainer width="100%" height={310}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    dataKey="value"
                    nameKey="name"
                    outerRadius={125}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                    stroke="#ffffff"
                  >
                    {statusData.map((item) => (
                      <Cell key={item.name} fill={item.color} />
                    ))}
                  </Pie>

                  <Tooltip formatter={(value) => `${value} hari`} />
                </PieChart>
              </ResponsiveContainer>

              <div className="status-list">
                {statusData.map((item) => (
                  <div className="status-row" key={item.name}>
                    <span>
                      <i style={{ backgroundColor: item.color }} />
                      {item.name}
                    </span>

                    <strong>{item.value} hari</strong>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="panel chart-card">
            <h2>Kehadiran per Institusi</h2>

            <ResponsiveContainer width="100%" height={390}>
              <BarChart
                data={institutionData}
                margin={{ top: 18, right: 12, left: 0, bottom: 18 }}
              >
                <CartesianGrid strokeDasharray="4 4" stroke="#dfe9e6" />
                <XAxis dataKey="institution" tick={{ fill: COLORS.text }} />
                <YAxis tick={{ fill: COLORS.text }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Hadir" fill={COLORS.present} />
                <Bar dataKey="Telat" fill={COLORS.late} />
                <Bar dataKey="Alpha" fill={COLORS.absent} />
              </BarChart>
            </ResponsiveContainer>
          </article>
        </section>

        <section className="panel chart-card wide">
          <h2>Tren Kehadiran Harian</h2>

          <ResponsiveContainer width="100%" height={360}>
            <LineChart
              data={dailyTrend}
              margin={{ top: 18, right: 16, left: 0, bottom: 18 }}
            >
              <CartesianGrid strokeDasharray="4 4" stroke="#dfe9e6" />
              <XAxis dataKey="date" tick={{ fill: COLORS.text }} />
              <YAxis domain={[0, 40]} tick={{ fill: COLORS.text }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="total"
                name="Total Hadir"
                stroke={COLORS.present}
                strokeWidth={4}
                dot={{ r: 4, strokeWidth: 3, fill: "#ffffff" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </section>

        <section className="panel summary-panel">
          <h2>Ringkasan Laporan</h2>

          <div className="summary-grid">
            <StatCard label="Total Peserta Aktif" value={totals.active} />

            <StatCard
              label="Total Kehadiran"
              value={totals.present}
              variant="success"
            />

            <StatCard
              label="Persentase Kehadiran"
              value={`${totals.percentage.toFixed(1)}%`}
            />

            <StatCard
              label="Periode"
              value={`${formatDate(startDate)} - ${formatDate(endDate)}`}
              variant="neutral"
            />
          </div>
        </section>

        <section className="panel table-panel">
          <h2>Detail Kehadiran per Peserta</h2>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Institusi</th>
                  <th>Hadir</th>
                  <th>Telat</th>
                  <th>Alpha</th>
                  <th>Persentase</th>
                </tr>
              </thead>

              <tbody>
                {tableRows.map((item) => (
                  <tr key={`${item.name}-${item.institution}`}>
                    <td>{item.name}</td>
                    <td>{item.institution}</td>
                    <td>{item.present}</td>
                    <td>{item.late}</td>
                    <td>{item.absent}</td>
                    <td>
                      <span className="percentage-pill">
                        {item.percentage.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}