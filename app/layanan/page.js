"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { formatRupiah } from "@/lib/format";

export default function HalamanLayanan() {
  const [daftar, setDaftar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menyimpan, setMenyimpan] = useState(false);

  const [nama, setNama] = useState("");
  const [satuan, setSatuan] = useState("kg");
  const [harga, setHarga] = useState("");

  useEffect(() => {
    ambilData();
  }, []);

  async function ambilData() {
    setLoading(true);
    const { data, error } = await supabase
      .from("layanan")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    setDaftar(data || []);
    setLoading(false);
  }

  async function tambahLayanan(e) {
    e.preventDefault();
    if (!nama.trim() || !harga) return;

    setMenyimpan(true);
    const { error } = await supabase
      .from("layanan")
      .insert({ nama, satuan, harga: Number(harga) });
    setMenyimpan(false);

    if (error) {
      setError(error.message);
      return;
    }
    setNama("");
    setHarga("");
    ambilData();
  }

  async function hapusLayanan(id) {
    if (!confirm("Hapus layanan ini?")) return;
    const { error } = await supabase.from("layanan").delete().eq("id", id);
    if (error) {
      alert("Gagal menghapus: " + error.message);
      return;
    }
    setDaftar((prev) => prev.filter((l) => l.id !== id));
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Layanan &amp; Harga</h1>
          <p className="page-subtitle">
            Atur jenis layanan cuci dan harga per satuan
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 24 }}>
        <form className="card form-grid" onSubmit={tambahLayanan}>
          <h3 style={{ fontSize: 16 }}>Tambah Layanan</h3>
          <div className="field">
            <label>Nama Layanan</label>
            <input
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Cuci Kiloan Reguler"
              required
            />
          </div>
          <div className="field">
            <label>Satuan</label>
            <select value={satuan} onChange={(e) => setSatuan(e.target.value)}>
              <option value="kg">Kilogram (kg)</option>
              <option value="pcs">Per Item (pcs)</option>
            </select>
          </div>
          <div className="field">
            <label>Harga per satuan (Rp)</label>
            <input
              type="number"
              min="0"
              value={harga}
              onChange={(e) => setHarga(e.target.value)}
              placeholder="7000"
              required
            />
          </div>
          <button className="btn btn-primary" disabled={menyimpan}>
            {menyimpan ? "Menyimpan..." : "Simpan Layanan"}
          </button>
        </form>

        <div className="table-wrap" style={{ alignSelf: "start" }}>
          {loading ? (
            <div className="empty-state">Memuat data...</div>
          ) : daftar.length === 0 ? (
            <div className="empty-state">
              <span className="empty-emoji">🏷️</span>
              Belum ada layanan.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Nama Layanan</th>
                  <th>Satuan</th>
                  <th>Harga</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {daftar.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <strong>{l.nama}</strong>
                    </td>
                    <td>{l.satuan}</td>
                    <td>
                      {formatRupiah(l.harga)} / {l.satuan}
                    </td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => hapusLayanan(l.id)}
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
    </div>
  );
}
