import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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

function formatDate(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

function formatTimeStr(value?: string) {
  if (!value) return "-";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return value;
  }
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

// Function removed, using xlsx instead

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
        // Fetch peserta and all absensi (admin gets all records)
        // Pass date range to backend for efficient filtering
        const [pesertaRes, absensiRes] = await Promise.all([
          api.get("/peserta"),
          api.get("/absensi/history", { params: { from: startDate, to: endDate } }),
        ]);

        // Unwrap nested data structure
        const pesertaData = pesertaRes.data?.data ?? pesertaRes.data ?? [];
        const absensiData = absensiRes.data?.data ?? absensiRes.data ?? [];

        setPesertaList(Array.isArray(pesertaData) ? pesertaData : []);
        setAbsensiList(Array.isArray(absensiData) ? absensiData : []);
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
  }, [startDate, endDate]);

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

  const exportExcel = () => {
    const data = tableRows.map((item, i) => ({
      No: i + 1,
      Nama: item.name,
      "NIM/NIS": item.number,
      Institusi: item.institution,
      Hadir: item.present,
      Telat: item.late,
      Alpha: item.absent,
      Persentase: `${item.percentage.toFixed(1)}%`,
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Absensi");
    XLSX.writeFile(workbook, "Laporan_Absensi.xlsx");
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Laporan Kehadiran PKL", 14, 20);
    
    doc.setFontSize(11);
    doc.text(`Periode: ${formatDate(startDate)} - ${formatDate(endDate)}`, 14, 28);
    doc.text(`Institusi: ${institution}`, 14, 34);

    const tableData = tableRows.map((item, i) => [
      i + 1,
      item.name,
      item.number,
      item.institution,
      item.present,
      item.late,
      item.absent,
      `${item.percentage.toFixed(1)}%`,
    ]);

    autoTable(doc, {
      startY: 40,
      head: [["No", "Nama", "NIM/NIS", "Institusi", "Hadir", "Telat", "Alpha", "%"]],
      body: tableData,
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [26, 92, 56],
        textColor: 255,
        halign: "center",
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 10 },
        4: { halign: "center", cellWidth: 15 },
        5: { halign: "center", cellWidth: 15 },
        6: { halign: "center", cellWidth: 15 },
        7: { halign: "center", cellWidth: 15 },
      },
    });

    doc.save("Laporan_Absensi.pdf");
  };

  // Detail absensi flat list for the detail table (filtered)
  const detailAbsensi = useMemo(() => {
    return filteredAbsensi.map((item) => {
      const peserta = pesertaMap.get(item.id_peserta);
      return {
        ...item,
        namaLengkap: item.peserta?.user?.nama || peserta?.user?.nama || "-",
        nimNis: item.peserta?.nim_nis || peserta?.nim_nis || "-",
        institusi:
          item.peserta?.asal_instansi ||
          item.peserta?.institusi ||
          peserta?.asal_instansi ||
          peserta?.institusi ||
          "-",
      };
    }).sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [filteredAbsensi, pesertaMap]);

  return (
    <main className="attendance-page">
      <div className="page-content">
        {/* Filter Panel */}
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
            <button className="export-button excel" onClick={exportExcel} disabled={loading}>
              <FileSpreadsheet size={22} />
              Export ke Excel
            </button>

            <button className="export-button pdf" onClick={exportPdf} disabled={loading}>
              <FileText size={22} />
              Export ke PDF
            </button>
          </div>

          {loading && <p className="laporan-message">Memuat data laporan...</p>}
          {!loading && errorMessage && <p className="laporan-message error">{errorMessage}</p>}
        </section>

        {/* Summary Stats */}
        {!loading && !errorMessage && (
          <section className="panel summary-panel">
            <h2>Ringkasan Laporan</h2>
            <div className="summary-grid">
              <StatCard label="Total Peserta Aktif" value={totals.active} />
              <StatCard
                label="Total Hadir"
                value={totals.present}
                variant="success"
              />
              <StatCard
                label="Total Telat"
                value={totals.late}
                variant="soft"
              />
              <StatCard
                label="Total Alpha"
                value={totals.absent}
                variant="soft"
              />
              <StatCard
                label="Persentase Kehadiran"
                value={`${totals.percentage.toFixed(1)}%`}
              />
              <StatCard
                label="Periode"
                value={`${formatDate(startDate)} – ${formatDate(endDate)}`}
                variant="neutral"
              />
            </div>
          </section>
        )}

        {/* Rekap per Peserta */}
        {!loading && !errorMessage && (
          <section className="panel table-panel">
            <h2>Rekap Kehadiran per Peserta</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>No</th>
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
                  {tableRows.map((item, i) => (
                    <tr key={item.id}>
                      <td>{i + 1}</td>
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
                      <td colSpan={8} style={{ textAlign: "center" }}>
                        Belum ada data laporan untuk periode ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Detail Absensi */}
        {!loading && !errorMessage && (
          <section className="panel table-panel">
            <h2>Detail Log Absensi</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Nama</th>
                    <th>NIM/NIS</th>
                    <th>Institusi</th>
                    <th>Tanggal</th>
                    <th>Jam Masuk</th>
                    <th>Jam Pulang</th>
                    <th>Status</th>
                    <th>Lokasi</th>
                  </tr>
                </thead>
                <tbody>
                  {detailAbsensi.map((item, i) => (
                    <tr key={item.id_absensi}>
                      <td>{i + 1}</td>
                      <td>{item.namaLengkap}</td>
                      <td>{item.nimNis}</td>
                      <td>{item.institusi}</td>
                      <td>{formatDate(item.tanggal)}</td>
                      <td>{formatTimeStr(item.jam_masuk)}</td>
                      <td>{formatTimeStr(item.jam_pulang)}</td>
                      <td>
                        <span
                          className={`status-badge-laporan status-${item.status.replace(/\s+/g, "-")}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td>{item.lokasi || "-"}</td>
                    </tr>
                  ))}
                  {!loading && detailAbsensi.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ textAlign: "center" }}>
                        Tidak ada data absensi pada periode ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
