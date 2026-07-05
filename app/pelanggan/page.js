"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";

export default function HalamanPelanggan() {
  const { user, profile, loading: loadingAuth } = useAuth();
  const router = useRouter();
  const [daftar, setDaftar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menyimpan, setMenyimpan] = useState(false);

  const [nama, setNama] = useState("");
  const [telepon, setTelepon] = useState("");
  const [alamat, setAlamat] = useState("");

  useEffect(() => {
    if (!loadingAuth) {
      if (!user) router.push("/login");
      else if (profile?.role === "customer") router.push("/pesanan-saya");
    }
  }, [loadingAuth, user, profile, router]);

  useEffect(() => {
    ambilData();
  }, []);

  async function ambilData() {
    setLoading(true);
    const { data, error } = await supabase
      .from("pelanggan")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    setDaftar(data || []);
    setLoading(false);
  }

  async function tambahPelanggan(e) {
    e.preventDefault();
    if (!nama.trim()) return;

    setMenyimpan(true);
    const { error } = await supabase
      .from("pelanggan")
      .insert({ nama, telepon, alamat });
    setMenyimpan(false);

    if (error) {
      setError(error.message);
      return;
    }
    setNama("");
    setTelepon("");
    setAlamat("");
    ambilData();
  }

  async function hapusPelanggan(id) {
    if (!confirm("Hapus pelanggan ini?")) return;
    const { error } = await supabase.from("pelanggan").delete().eq("id", id);
    if (error) {
      alert("Gagal menghapus: " + error.message);
      return;
    }
    setDaftar((prev) => prev.filter((p) => p.id !== id));
  }

  if (loadingAuth || !user || profile?.role !== "admin") {
    return <div className="card">Memuat...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Pelanggan</h1>
          <p className="page-subtitle">Kelola data pelanggan laundry</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 24 }}>
        <form className="card form-grid" onSubmit={tambahPelanggan}>
          <h3 style={{ fontSize: 16 }}>Tambah Pelanggan</h3>
          <div className="field">
            <label>Nama</label>
            <input value={nama} onChange={(e) => setNama(e.target.value)} required />
          </div>
          <div className="field">
            <label>No. Telepon</label>
            <input
              value={telepon}
              onChange={(e) => setTelepon(e.target.value)}
              placeholder="0812xxxxxxx"
            />
          </div>
          <div className="field">
            <label>Alamat</label>
            <textarea
              rows={2}
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" disabled={menyimpan}>
            {menyimpan ? "Menyimpan..." : "Simpan Pelanggan"}
          </button>
        </form>

        <div className="table-wrap" style={{ alignSelf: "start" }}>
          {loading ? (
            <div className="empty-state">Memuat data...</div>
          ) : daftar.length === 0 ? (
            <div className="empty-state">
              <span className="empty-emoji">👤</span>
              Belum ada pelanggan.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Telepon</th>
                  <th>Alamat</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {daftar.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.nama}</strong>
                    </td>
                    <td>{p.telepon || "-"}</td>
                    <td>{p.alamat || "-"}</td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => hapusPelanggan(p.id)}
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
