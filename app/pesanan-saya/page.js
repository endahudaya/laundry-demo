"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { formatRupiah, formatTanggal, labelStatus, warnaStatus } from "@/lib/format";
import { estimasiSelesai, formatDurasi, formatJamSelesai } from "@/lib/estimasi";

export default function HalamanPesananSaya() {
  const { user, profile, loading: loadingAuth } = useAuth();
  const router = useRouter();

  const [pesanan, setPesanan] = useState([]);
  const [layananList, setLayananList] = useState([]);
  const [layananId, setLayananId] = useState("");
  const [jumlah, setJumlah] = useState(1);
  const [pelangganId, setPelangganId] = useState(null);
  const [antrianAktif, setAntrianAktif] = useState(0);
  const [metodeAntar, setMetodeAntar] = useState("antar_sendiri");
  const [alamatJemput, setAlamatJemput] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(true);
  const [menyimpan, setMenyimpan] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push("/login");
    }
  }, [loadingAuth, user, router]);

  useEffect(() => {
    if (user) ambilData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function ambilData() {
    setLoading(true);
    setError("");

    const { data: pelangganSaya, error: errorPelanggan } = await supabase
      .from("pelanggan")
      .select("id, telepon, alamat")
      .eq("user_id", user.id)
      .maybeSingle();

    if (errorPelanggan) {
      setError("Gagal memuat data akun: " + errorPelanggan.message);
    } else if (!pelangganSaya) {
      // Self-healing: kalau data pelanggan belum ada, buatkan sekarang.
      // Pakai upsert (bukan insert biasa) supaya walaupun proses ini
      // sempat jalan dobel, tetap tidak akan membuat data kembar.
      const namaAwal = profile?.nama || user.email;
      const { data: pelangganBaru, error: errorBuat } = await supabase
        .from("pelanggan")
        .upsert(
          { user_id: user.id, nama: namaAwal, telepon: "", alamat: "" },
          { onConflict: "user_id", ignoreDuplicates: false }
        )
        .select("id, telepon, alamat")
        .single();

      if (errorBuat) {
        setError("Gagal menyiapkan data akun: " + errorBuat.message);
      } else if (pelangganBaru) {
        setPelangganId(pelangganBaru.id);
      }
    }

    if (pelangganSaya) {
      setPelangganId(pelangganSaya.id);
      if (pelangganSaya.alamat) setAlamatJemput(pelangganSaya.alamat);
      if (pelangganSaya.telepon) setWhatsapp(pelangganSaya.telepon);
    }

    const { data: layanan } = await supabase.from("layanan").select("*").order("nama");
    setLayananList(layanan || []);
    if (layanan?.length) setLayananId(layanan[0].id);

    const { data: antrian } = await supabase.rpc("get_antrian_aktif");
    setAntrianAktif(antrian || 0);

    if (pelangganSaya) {
      const { data, error } = await supabase
        .from("pesanan")
        .select(
          `id, jumlah, total_harga, status, created_at, metode_antar, alamat_jemput, layanan ( nama, satuan )`
        )
        .eq("pelanggan_id", pelangganSaya.id)
        .order("created_at", { ascending: false });

      if (error) setError(error.message);
      setPesanan(data || []);
    }

    setLoading(false);
  }

  const layananTerpilih = layananList.find((l) => l.id === layananId);
  const totalHarga = layananTerpilih ? layananTerpilih.harga * (jumlah || 0) : 0;

  const estimasiBaru =
    layananTerpilih && jumlah > 0
      ? estimasiSelesai(layananTerpilih, jumlah, antrianAktif)
      : null;

  function getEstimasiPesanan(p) {
    if (p.status === "selesai") return null;
    return estimasiSelesai(p.layanan, p.jumlah, antrianAktif, new Date(p.created_at));
  }

  async function buatPesanan(e) {
    e.preventDefault();

    if (!pelangganId) {
      setError(
        "Data akun kamu belum siap. Coba refresh halaman ini (Cmd+R), tunggu beberapa detik, lalu coba lagi."
      );
      return;
    }
    if (!layananId) {
      setError("Pilih layanan dulu sebelum kirim pesanan.");
      return;
    }

    if (!whatsapp.trim()) {
      setError("Isi dulu nomor WhatsApp kamu, biar bisa dikabarin soal pesanan ini.");
      return;
    }

    if (metodeAntar === "jemput" && !alamatJemput.trim()) {
      setError("Isi dulu alamat penjemputan.");
      return;
    }

    setMenyimpan(true);

    // simpan/update nomor WA ke data pelanggan
    await supabase.from("pelanggan").update({ telepon: whatsapp.trim() }).eq("id", pelangganId);

    const { error } = await supabase.from("pesanan").insert({
      pelanggan_id: pelangganId,
      layanan_id: layananId,
      jumlah: Number(jumlah),
      total_harga: totalHarga,
      metode_antar: metodeAntar,
      alamat_jemput: metodeAntar === "jemput" ? alamatJemput : null,
      status: metodeAntar === "jemput" ? "menunggu_dijemput" : "diterima",
    });
    setMenyimpan(false);

    if (error) {
      setError(error.message);
      return;
    }
    ambilData();
  }

  if (loadingAuth || loading) {
    return <div className="card">Memuat...</div>;
  }

  if (!user) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Pesanan Saya</h1>
          <p className="page-subtitle">
            Halo, {profile?.nama || user.email}! Pantau laundry kamu di sini.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* RIWAYAT PESANAN - full width di atas */}
      <div className="table-wrap table-scroll" style={{ marginBottom: 24 }}>
        {pesanan.length === 0 ? (
          <div className="empty-state">
            <span className="empty-emoji">🧺</span>
            Belum ada pesanan. Buat pesanan baru di form bawah ini.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Layanan</th>
                <th>Jumlah</th>
                <th>Total</th>
                <th>Status</th>
                <th>Estimasi Selesai</th>
                <th>Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {pesanan.map((p) => {
                const est = getEstimasiPesanan(p);
                return (
                  <tr key={p.id}>
                    <td>
                      {p.layanan?.nama}
                      {p.metode_antar === "jemput" && (
                        <div style={{ fontSize: 11.5, color: "#ea580c", marginTop: 2 }}>
                          🛵 Jemput: {p.alamat_jemput}
                        </div>
                      )}
                    </td>
                    <td>
                      {p.jumlah} {p.layanan?.satuan}
                    </td>
                    <td>{formatRupiah(p.total_harga)}</td>
                    <td>
                      <span className="badge" style={{ background: warnaStatus(p.status) }}>
                        <span className="badge-dot"></span>
                        {labelStatus(p.status)}
                      </span>
                    </td>
                    <td>
                      {est ? (
                        <div className="estimasi-box">
                          <span className="estimasi-jam">⏱ {formatJamSelesai(est.selesai)}</span>
                          <span className="estimasi-durasi">
                            ~{formatDurasi(est.totalMenit)} lagi
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: "#059669", fontWeight: 600 }}>✓ Selesai</span>
                      )}
                    </td>
                    <td>{formatTanggal(p.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* FORM PESANAN BARU + KARTU ESTIMASI - sejajar di bawah */}
      <div className="layout-sidebar-right">
        <form className="card form-grid" onSubmit={buatPesanan} style={{ maxWidth: "100%" }}>
          <h3 style={{ fontSize: 15 }}>Buat Pesanan Baru</h3>

          <div className="field">
            <label>Nomor WhatsApp</label>
            <input
              type="tel"
              placeholder="0812xxxxxxx"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
            <span className="field-hint">
              Dipakai admin buat kabarin status pesanan kamu lewat WhatsApp
            </span>
          </div>

          <div className="field">
            <label>Layanan</label>
            <select value={layananId} onChange={(e) => setLayananId(e.target.value)}>
              {layananList.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nama} — Rp{l.harga}/{l.satuan}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Jumlah ({layananTerpilih ? layananTerpilih.satuan : "satuan"})</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={jumlah}
              onChange={(e) => setJumlah(e.target.value)}
            />
            <span className="field-hint">
              Estimasi biaya: <strong>{formatRupiah(totalHarga)}</strong>
            </span>
          </div>

          <div className="field">
            <label>Metode Pengantaran</label>
            <div className="metode-antar-pilihan">
              <label
                className={`metode-antar-opsi ${metodeAntar === "antar_sendiri" ? "aktif" : ""}`}
              >
                <input
                  type="radio"
                  name="metodeAntar"
                  value="antar_sendiri"
                  checked={metodeAntar === "antar_sendiri"}
                  onChange={() => setMetodeAntar("antar_sendiri")}
                />
                🚶 Antar Sendiri ke Toko
              </label>
              <label className={`metode-antar-opsi ${metodeAntar === "jemput" ? "aktif" : ""}`}>
                <input
                  type="radio"
                  name="metodeAntar"
                  value="jemput"
                  checked={metodeAntar === "jemput"}
                  onChange={() => setMetodeAntar("jemput")}
                />
                🛵 Jemput di Alamat Saya
              </label>
            </div>
          </div>

          {metodeAntar === "jemput" && (
            <div className="field">
              <label>Alamat Penjemputan</label>
              <textarea
                rows={2}
                placeholder="Tulis alamat lengkap untuk dijemput"
                value={alamatJemput}
                onChange={(e) => setAlamatJemput(e.target.value)}
              />
            </div>
          )}
          <button className="btn btn-primary" disabled={menyimpan}>
            {menyimpan ? "Mengirim..." : "Kirim Pesanan"}
          </button>
        </form>

        <div className="card estimasi-card" style={{ position: "static" }}>
          <h3 style={{ fontSize: 15, marginBottom: 14 }}>⏱ Perkiraan Selesai</h3>
          {estimasiBaru ? (
            <>
              <div className="estimasi-besar">{formatJamSelesai(estimasiBaru.selesai)}</div>
              <div className="estimasi-keterangan">
                sekitar {formatDurasi(estimasiBaru.totalMenit)} dari sekarang
              </div>
              <div className="estimasi-antrian">
                {antrianAktif > 0
                  ? `Ada ${antrianAktif} pesanan lain dalam antrian`
                  : "Tidak ada antrian, langsung dikerjakan"}
              </div>
            </>
          ) : (
            <div style={{ color: "#64748b", fontSize: 13.5 }}>
              Pilih layanan &amp; jumlah dulu untuk melihat perkiraan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
