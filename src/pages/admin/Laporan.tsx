import { useEffect, useMemo, useState } from "react";
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
import api from "../../config/api";
import "../../css/LaporanAbsensi.css";

type Peserta = {
  id_peserta: number;
  nim_nis?: string;
  asal_instansi?: string;
  institusi?: string;
  jurusan?: string;
  status_pkl?: string;
  user?: {
    nama?: string;
    email?: string;
  };
};

type AbsensiRecord = {
  id_absensi: number;
  id_peserta: number;
  tanggal: string;
  jam_masuk?: string;
  jam_pulang?: string;
  status: string;
  lokasi?: string;
  peserta?: {
    nim_nis?: string;
    asal_instansi?: string;
    institusi?: string;
    user?: {
      nama?: string;
    };
  };
};

type ReportRow = {
  id: number;
  name: string;
  number: string;
  institution: string;
  present: number;
  late: number;
  absent: number;
  percentage: number;
};

const COLORS = {
  present: "#207a66",
  late: "#2ca58d",
  absent: "#6fcf97",
  text: "#00645f",
};

function formatDate(value: string) {
  if (!value) return "-";

  const date = new Date(value);

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

function formatChartDate(value: string) {
  const date = new Date(value);

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
  });
}

function getDateOnly(value: string) {
  if (!value) return "";
  return value.slice(0, 10);
}

function normalizeStatus(value: string) {
  const status = value.toLowerCase();

  if (status.includes("telat")) return "late";
  if (status.includes("alpha") || status.includes("tidak")) return "absent";
  return "present";
}

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
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

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
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

function StatCard({
  label,
  value,
  variant = "soft",
}: {
  label: string;
  value: string | number;
  variant?: string;
}) {
  return (
    <div className={`stat-card ${variant}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function LaporanAbsensi() {
  const today = new Date().toISOString().slice(0, 10);
  const firstDayOfMonth = `${today.slice(0, 8)}01`;

  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [institution, setInstitution] = useState("Semua Institusi");
  const [pesertaList, setPesertaList] = useState<Peserta[]>([]);
  const [absensiList, setAbsensiList] = useState<AbsensiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const [pesertaRes, absensiRes] = await Promise.all([
          api.get("/peserta"),
          api.get("/absensi/history"),
        ]);

        setPesertaList(pesertaRes.data.data || pesertaRes.data || []);
        setAbsensiList(absensiRes.data.data || absensiRes.data || []);
      } catch (error: any) {
        setPesertaList([]);
        setAbsensiList([]);
        setErrorMessage(
          error.response?.data?.message || "Gagal memuat data laporan"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, []);

  const pesertaMap = useMemo(() => {
    return new Map(pesertaList.map((item) => [item.id_peserta, item]));
  }, [pesertaList]);

  const institutions = useMemo(() => {
    const values = new Set<string>();

    pesertaList.forEach((item) => {
      const name = item.asal_instansi || item.institusi;
      if (name) values.add(name);
    });

    absensiList.forEach((item) => {
      const name =
        item.peserta?.asal_instansi ||
        item.peserta?.institusi ||
        pesertaMap.get(item.id_peserta)?.asal_instansi ||
        pesertaMap.get(item.id_peserta)?.institusi;
      if (name) values.add(name);
    });

    return ["Semua Institusi", ...Array.from(values).sort()];
  }, [absensiList, pesertaList, pesertaMap]);

  const filteredAbsensi = useMemo(() => {
    return absensiList.filter((item) => {
      const date = getDateOnly(item.tanggal);
      const peserta = pesertaMap.get(item.id_peserta);
      const itemInstitution =
        peserta?.asal_instansi ||
        peserta?.institusi ||
        item.peserta?.asal_instansi ||
        item.peserta?.institusi ||
        "-";

      const matchesDate = date >= startDate && date <= endDate;
      const matchesInstitution =
        institution === "Semua Institusi" || itemInstitution === institution;

      return matchesDate && matchesInstitution;
    });
  }, [absensiList, endDate, institution, pesertaMap, startDate]);

  const tableRows = useMemo<ReportRow[]>(() => {
    const rows = new Map<number, ReportRow>();

    pesertaList.forEach((peserta) => {
      const pesertaInstitution = peserta.asal_instansi || peserta.institusi || "-";

      if (
        institution !== "Semua Institusi" &&
        pesertaInstitution !== institution
      ) {
        return;
      }

      rows.set(peserta.id_peserta, {
        id: peserta.id_peserta,
        name: peserta.user?.nama || "-",
        number: peserta.nim_nis || "-",
        institution: pesertaInstitution,
        present: 0,
        late: 0,
        absent: 0,
        percentage: 0,
      });
    });

    filteredAbsensi.forEach((item) => {
      const peserta = pesertaMap.get(item.id_peserta);
      const row =
        rows.get(item.id_peserta) ||
        ({
          id: item.id_peserta,
          name: item.peserta?.user?.nama || "-",
          number: item.peserta?.nim_nis || peserta?.nim_nis || "-",
          institution:
            peserta?.asal_instansi ||
            peserta?.institusi ||
            item.peserta?.asal_instansi ||
            item.peserta?.institusi ||
            "-",
          present: 0,
          late: 0,
          absent: 0,
          percentage: 0,
        } satisfies ReportRow);

      const status = normalizeStatus(item.status);
      if (status === "late") row.late += 1;
      else if (status === "absent") row.absent += 1;
      else row.present += 1;

      rows.set(item.id_peserta, row);
    });

    return Array.from(rows.values())
      .map((row) => {
        const total = row.present + row.late + row.absent;

        return {
          ...row,
          percentage: total ? (row.present / total) * 100 : 0,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredAbsensi, institution, pesertaList, pesertaMap]);

  const totals = useMemo(() => {
    const summary = tableRows.reduce(
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
      active: tableRows.length,
      percentage: all ? (summary.present / all) * 100 : 0,
    };
  }, [tableRows]);

  const statusData = [
    { name: "Hadir", value: totals.present, color: COLORS.present },
    { name: "Telat", value: totals.late, color: COLORS.late },
    { name: "Alpha", value: totals.absent, color: COLORS.absent },
  ];

  const institutionData = useMemo(() => {
    const grouped = new Map<
      string,
      { institution: string; Hadir: number; Telat: number; Alpha: number }
    >();

    filteredAbsensi.forEach((item) => {
      const peserta = pesertaMap.get(item.id_peserta);
      const name =
        peserta?.asal_instansi ||
        peserta?.institusi ||
        item.peserta?.asal_instansi ||
        item.peserta?.institusi ||
        "-";
      const row =
        grouped.get(name) || { institution: name, Hadir: 0, Telat: 0, Alpha: 0 };
      const status = normalizeStatus(item.status);

      if (status === "late") row.Telat += 1;
      else if (status === "absent") row.Alpha += 1;
      else row.Hadir += 1;

      grouped.set(name, row);
    });

    return Array.from(grouped.values()).sort((a, b) =>
      a.institution.localeCompare(b.institution)
    );
  }, [filteredAbsensi, pesertaMap]);

  const dailyTrend = useMemo(() => {
    const grouped = new Map<string, number>();

    filteredAbsensi.forEach((item) => {
      const date = getDateOnly(item.tanggal);
      const current = grouped.get(date) || 0;
      grouped.set(date, current + (normalizeStatus(item.status) === "absent" ? 0 : 1));
    });

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => ({ date: formatChartDate(date), total }));
  }, [filteredAbsensi]);

  const exportExcel = () => {
    downloadCsv("laporan-absensi.csv", [
      ["Nama", "NIM/NIS", "Institusi", "Hadir", "Telat", "Alpha", "Persentase"],
      ...tableRows.map((item) => [
        item.name,
        item.number,
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
      <header className="laporan-topbar">
        <div className="topbar-inner">
          <button className="icon-button" aria-label="Kembali">
            <ArrowLeft size={28} />
          </button>

          <div>
            <h1>Laporan Absensi</h1>
            <p>Analisis dan ekspor data absensi peserta</p>
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

          {loading && <p className="laporan-message">Memuat data laporan...</p>}
          {errorMessage && <p className="laporan-message error">{errorMessage}</p>}
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
              <YAxis tick={{ fill: COLORS.text }} />
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
                  <th>NIM/NIS</th>
                  <th>Institusi</th>
                  <th>Hadir</th>
                  <th>Telat</th>
                  <th>Alpha</th>
                  <th>Persentase</th>
                </tr>
              </thead>

              <tbody>
                {tableRows.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.number}</td>
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

                {!loading && tableRows.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center" }}>
                      Belum ada data laporan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
