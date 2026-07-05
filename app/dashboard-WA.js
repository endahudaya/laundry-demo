"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import {
  formatRupiah,
  formatTanggal,
  labelStatus,
  warnaStatus,
  DAFTAR_STATUS,
} from "@/lib/format";
import { estimasiSelesai, formatDurasi, formatJamSelesai } from "@/lib/estimasi";

export default function HalamanDashboard() {
  const { user, profile, loading: loadingAuth } = useAuth();
  const router = useRouter();
  const [pesanan, setPesanan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toasts, setToasts] = useState([]);
  const idsSaatIni = useRef(new Set());
  const pertamaKali = useRef(true);

  useEffect(() => {
    if (!loadingAuth) {
      if (!user) router.push("/login");
      else if (profile?.role === "customer") router.push("/pesanan-saya");
    }
  }, [loadingAuth, user, profile, router]);

  useEffect(() => {
    ambilPesanan(true);

    // ============================================================
    // REALTIME: dengarkan perubahan tabel "pesanan" dari Supabase.
    // Setiap ada INSERT/UPDATE/DELETE (dari device manapun), kita
    // ambil ulang datanya supaya semua layar selalu sinkron tanpa
    // perlu refresh manual.
    // ============================================================
    const channel = supabase
      .channel("realtime-pesanan")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pesanan" },
        () => {
          ambilPesanan(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function ambilPesanan(initial) {
    if (initial) setLoading(true);
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
        metode_antar,
        alamat_jemput,
        pelanggan ( id, nama, telepon ),
        layanan ( id, nama, satuan )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const daftarBaru = data || [];

    // Deteksi pesanan baru (untuk notifikasi toast), kecuali saat
    // pertama kali halaman dibuka (biar tidak nge-toast semua data lama).
    if (!pertamaKali.current) {
      const idBaru = daftarBaru.filter((p) => !idsSaatIni.current.has(p.id));
      idBaru.forEach((p) => {
        tampilkanToast(`🧺 Pesanan baru dari ${p.pelanggan?.nama || "pelanggan"}`);
      });
    }

    idsSaatIni.current = new Set(daftarBaru.map((p) => p.id));
    pertamaKali.current = false;

    setPesanan(daftarBaru);
    setLoading(false);
  }

  function tampilkanToast(pesan) {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, pesan }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
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
    // Tidak perlu update manual state di sini — realtime subscription
    // di atas akan otomatis menarik ulang data untuk semua layar.
  }

  async function hapusPesanan(id) {
    if (!confirm("Yakin ingin menghapus pesanan ini?")) return;
    const { error } = await supabase.from("pesanan").delete().eq("id", id);
    if (error) {
      alert("Gagal menghapus: " + error.message);
      return;
    }
  }

  const totalPendapatan = pesanan.reduce((sum, p) => sum + (p.total_harga || 0), 0);
  const belumSelesai = pesanan.filter((p) => p.status !== "selesai");

  // Urutkan antrian (yang belum selesai) dari yang paling lama masuk,
  // supaya perhitungan "berapa antrian di depan" akurat.
  const antrianUrut = [...belumSelesai].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );

  function getEstimasi(p) {
    if (p.status === "selesai") return null;
    const posisi = antrianUrut.findIndex((x) => x.id === p.id);
    const antrianDidepan = posisi >= 0 ? posisi : 0;
    return estimasiSelesai(p.layanan, p.jumlah, antrianDidepan, new Date(p.created_at));
  }

  if (loadingAuth || !user || profile?.role !== "admin") {
    return <div className="card">Memuat...</div>;
  }

  return (
    <div>
      {/* TOAST NOTIFIKASI REALTIME */}
      <div className="toast-wrap">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            {t.pesan}
          </div>
        ))}
      </div>

      <div className="page-header">
        <div>
          <h1>Daftar Pesanan</h1>
          <p className="page-subtitle">
            Pantau semua pesanan laundry secara realtime
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
          <div className="stat-value">{belumSelesai.length}</div>
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

      <div className="table-wrap table-scroll">
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
                <th>Estimasi Selesai</th>
                <th>Tanggal Masuk</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pesanan.map((p) => {
                const est = getEstimasi(p);
                return (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.pelanggan?.nama || "-"}</strong>
                      <div style={{ color: "#8a9a98", fontSize: 12.5 }}>
                        {p.pelanggan?.telepon ? (
                          <a
                            href={`https://wa.me/62${p.pelanggan.telepon.replace(/^0/, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "#059669", fontWeight: 600 }}
                          >
                            💬 {p.pelanggan.telepon}
                          </a>
                        ) : (
                          ""
                        )}
                      </div>
                      {p.metode_antar === "jemput" && (
                        <div style={{ color: "#ea580c", fontSize: 11.5, marginTop: 2, fontWeight: 600 }}>
                          🛵 Jemput: {p.alamat_jemput}
                        </div>
                      )}
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
                    <td>
                      {est ? (
                        <div className="estimasi-box">
                          <span className="estimasi-jam">
                            ⏱ {formatJamSelesai(est.selesai)}
                          </span>
                          <span className="estimasi-durasi">
                            ~{formatDurasi(est.totalMenit)} lagi
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: "#059669", fontWeight: 600 }}>
                          ✓ Sudah selesai
                        </span>
                      )}
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
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
