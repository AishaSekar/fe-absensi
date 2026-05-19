import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../config/api";
import "../../css/Peserta.css";

const fallbackPeserta = [
  {
    id: 1,
    nama: "Ahmad Fauzi",
    jurusan: "Teknik Informatika",
    nomor: "2021001234",
    institusi: "UHAMKA",
    status: "Diterima",
  },
  {
    id: 2,
    nama: "Siti Nurhaliza",
    jurusan: "Rekayasa Perangkat Lunak",
    nomor: "2021001235",
    institusi: "SMK N 1",
    status: "Pending",
  },
  {
    id: 3,
    nama: "Budi Santoso",
    jurusan: "Sistem Informasi",
    nomor: "2021001236",
    institusi: "UHAMKA",
    status: "Diterima",
  },
  {
    id: 4,
    nama: "Dewi Lestari",
    jurusan: "Multimedia",
    nomor: "2021001237",
    institusi: "SMK N 2",
    status: "Pending",
  },
  {
    id: 5,
    nama: "Eko Prasetyo",
    jurusan: "Teknik Informatika",
    nomor: "2021001238",
    institusi: "UHAMKA",
    status: "Ditolak",
  },
];

export default function KelolaPeserta() {
  const navigate = useNavigate();
  const [peserta, setPeserta] = useState(fallbackPeserta);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Semua Status");

  useEffect(() => {
    const getPeserta = async () => {
      try {
        const response = await api.get("/peserta");
        setPeserta(response.data.data || response.data);
      } catch (error) {
        console.error("Gagal mengambil data peserta:", error);
      }
    };

    getPeserta();
  }, []);

  const filteredPeserta = useMemo(() => {
    return peserta.filter((item) => {
      const keyword = search.toLowerCase();
      const cocokSearch = [
        item.nama,
        item.jurusan,
        item.nomor,
        item.nim,
        item.nis,
        item.institusi,
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword);

      const cocokStatus =
        status === "Semua Status" || item.status === status;

      return cocokSearch && cocokStatus;
    });
  }, [peserta, search, status]);

  return (
    <>
      <header className="app-bar">
        <button className="back-button" onClick={() => navigate(-1)} aria-label="Kembali">
          ←
        </button>

        <div className="title-wrap">
          <h1>Kelola Peserta</h1>
          <p className="subtitle">Manajemen data peserta PKL</p>
        </div>
      </header>

      <main>
        <section className="panel">
          <div className="toolbar">
            <label className="search">
              <span className="search-icon">⌕</span>
              <input
                type="search"
                placeholder="Cari nama, NIM/NIS, atau institusi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>

            <select
              className="status-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option>Semua Status</option>
              <option>Diterima</option>
              <option>Pending</option>
              <option>Ditolak</option>
            </select>
          </div>

          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>NIM/NIS</th>
                <th>Institusi</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {filteredPeserta.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="name">
                      <span>{item.nama}</span>
                      <span className="major">{item.jurusan}</span>
                    </div>
                  </td>
                  <td>{item.nomor || item.nim || item.nis}</td>
                  <td>{item.institusi}</td>
                  <td>
                    <span className={`badge ${item.status.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button className="icon-button">👁</button>

                      {item.status === "Pending" && (
                        <>
                          <button className="icon-button approve">✓</button>
                          <button className="icon-button reject">×</button>
                        </>
                      )}

                      <button className="icon-button delete">🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </>
  );
}