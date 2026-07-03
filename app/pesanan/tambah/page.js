"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function HalamanTambahPesanan() {
  const router = useRouter();

  const [pelangganList, setPelangganList] = useState([]);
  const [layananList, setLayananList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menyimpan, setMenyimpan] = useState(false);
  const [error, setError] = useState("");

  const [pelangganId, setPelangganId] = useState("");
  const [layananId, setLayananId] = useState("");
  const [jumlah, setJumlah] = useState(1);
  const [catatan, setCatatan] = useState("");

  useEffect(() => {
    ambilData();
  }, []);

  async function ambilData() {
    setLoading(true);
    const [{ data: pelanggan }, { data: layanan }] = await Promise.all([
      supabase.from("pelanggan").select("*").order("nama"),
      supabase.from("layanan").select("*").order("nama"),
    ]);
    setPelangganList(pelanggan || []);
    setLayananList(layanan || []);
    if (pelanggan && pelanggan.length > 0) setPelangganId(pelanggan[0].id);
    if (layanan && layanan.length > 0) setLayananId(layanan[0].id);
    setLoading(false);
  }

  const layananTerpilih = layananList.find((l) => l.id === layananId);
  const totalHarga = layananTerpilih ? layananTerpilih.harga * (jumlah || 0) : 0;

  async function simpanPesanan(e) {
    e.preventDefault();
    setError("");

    if (!pelangganId || !layananId) {
      setError("Pilih pelanggan dan layanan terlebih dahulu.");
      return;
    }

    setMenyimpan(true);
    const { error } = await supabase.from("pesanan").insert({
      pelanggan_id: pelangganId,
      layanan_id: layananId,
      jumlah: Number(jumlah),
      total_harga: totalHarga,
      catatan,
      status: "diterima",
    });
    setMenyimpan(false);

    if (error) {
      setError(error.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Pesanan Baru</h1>
          <p className="page-subtitle">Catat pesanan laundry yang baru masuk</p>
        </div>
      </div>

      {loading ? (
        <div className="card">Memuat data pelanggan &amp; layanan...</div>
      ) : pelangganList.length === 0 || layananList.length === 0 ? (
        <div className="alert alert-warning">
          {pelangganList.length === 0 && (
            <div>
              Belum ada data pelanggan. Tambahkan dulu di halaman{" "}
              <a href="/pelanggan" style={{ textDecoration: "underline" }}>
                Pelanggan
              </a>
              .
            </div>
          )}
          {layananList.length === 0 && (
            <div>
              Belum ada data layanan. Tambahkan dulu di halaman{" "}
              <a href="/layanan" style={{ textDecoration: "underline" }}>
                Layanan &amp; Harga
              </a>
              .
            </div>
          )}
        </div>
      ) : (
        <form className="card form-grid" onSubmit={simpanPesanan}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="field">
            <label>Pelanggan</label>
            <select
              value={pelangganId}
              onChange={(e) => setPelangganId(e.target.value)}
            >
              {pelangganList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama} {p.telepon ? `(${p.telepon})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Layanan</label>
            <select
              value={layananId}
              onChange={(e) => setLayananId(e.target.value)}
            >
              {layananList.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nama} — Rp{l.harga}/{l.satuan}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>
              Jumlah ({layananTerpilih ? layananTerpilih.satuan : "satuan"})
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={jumlah}
              onChange={(e) => setJumlah(e.target.value)}
            />
            <span className="field-hint">
              Estimasi total: <strong>Rp{totalHarga.toLocaleString("id-ID")}</strong>
            </span>
          </div>

          <div className="field">
            <label>Catatan (opsional)</label>
            <textarea
              rows={3}
              placeholder="Contoh: jangan dicampur, wangi lavender, dsb."
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={menyimpan}>
              {menyimpan ? "Menyimpan..." : "Simpan Pesanan"}
            </button>
            <a href="/" className="btn btn-ghost">
              Batal
            </a>
          </div>
        </form>
      )}
    </div>
  );
}
