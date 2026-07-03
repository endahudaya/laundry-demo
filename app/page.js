"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  formatRupiah,
  formatTanggal,
  labelStatus,
  warnaStatus,
  DAFTAR_STATUS,
} from "@/lib/format";

export default function HalamanDashboard() {
  const [pesanan, setPesanan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    ambilPesanan();
  }, []);

  async function ambilPesanan() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("pesanan")
      .select(
        `
        id,
        jumlah,
        total_harga,
        status,
        catatan,
        created_at,
        pelanggan ( id, nama, telepon ),
        layanan ( id, nama, satuan )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setPesanan(data || []);
    }
    setLoading(false);
  }

  async function ubahStatus(id, statusBaru) {
    const { error } = await supabase
      .from("pesanan")
      .update({ status: statusBaru, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      alert("Gagal mengubah status: " + error.message);
      return;
    }
    setPesanan((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: statusBaru } : p))
    );
  }

  async function hapusPesanan(id) {
    if (!confirm("Yakin ingin menghapus pesanan ini?")) return;
    const { error } = await supabase.from("pesanan").delete().eq("id", id);
    if (error) {
      alert("Gagal menghapus: " + error.message);
      return;
    }
    setPesanan((prev) => prev.filter((p) => p.id !== id));
  }

  const totalPendapatan = pesanan.reduce(
    (sum, p) => sum + (p.total_harga || 0),
    0
  );
  const belumSelesai = pesanan.filter((p) => p.status !== "selesai").length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Daftar Pesanan</h1>
          <p className="page-subtitle">
            Pantau semua pesanan laundry yang masuk hari ini
          </p>
        </div>
        <a href="/pesanan/tambah" className="btn btn-sun">
          + Pesanan Baru
        </a>
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-value">{pesanan.length}</div>
          <div className="stat-label">Total Pesanan</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{belumSelesai}</div>
          <div className="stat-label">Belum Selesai</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{formatRupiah(totalPendapatan)}</div>
          <div className="stat-label">Total Nilai Pesanan</div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          Gagal memuat data: {error}. Pastikan Supabase sudah terhubung
          dengan benar (lihat README).
        </div>
      )}

      <div className="table-wrap">
        {loading ? (
          <div className="empty-state">Memuat data...</div>
        ) : pesanan.length === 0 ? (
          <div className="empty-state">
            <span className="empty-emoji">🧺</span>
            Belum ada pesanan. Klik &quot;Pesanan Baru&quot; untuk mulai
            mencatat.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Pelanggan</th>
                <th>Layanan</th>
                <th>Jumlah</th>
                <th>Total</th>
                <th>Status</th>
                <th>Tanggal Masuk</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pesanan.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.pelanggan?.nama || "-"}</strong>
                    <div style={{ color: "#8a9a98", fontSize: 12.5 }}>
                      {p.pelanggan?.telepon || ""}
                    </div>
                  </td>
                  <td>{p.layanan?.nama || "-"}</td>
                  <td>
                    {p.jumlah} {p.layanan?.satuan || ""}
                  </td>
                  <td>{formatRupiah(p.total_harga)}</td>
                  <td>
                    <select
                      className="status-select"
                      value={p.status}
                      style={{
                        backgroundColor: warnaStatus(p.status) + "22",
                        color: warnaStatus(p.status),
                        borderColor: warnaStatus(p.status) + "55",
                      }}
                      onChange={(e) => ubahStatus(p.id, e.target.value)}
                    >
                      {DAFTAR_STATUS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{formatTanggal(p.created_at)}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => hapusPesanan(p.id)}
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
