"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";

const NAMA_HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export default function HalamanHeatmap() {
  const { user, profile, loading: loadingAuth } = useAuth();
  const router = useRouter();

  const [matrix, setMatrix] = useState(() =>
    Array.from({ length: 7 }, () => Array(24).fill(0))
  );
  const [loading, setLoading] = useState(true);
  const [totalPesanan, setTotalPesanan] = useState(0);
  const [jamTersibuk, setJamTersibuk] = useState(null);
  const [jamSepi, setJamSepi] = useState(null);

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
    const { data, error } = await supabase.rpc("get_heatmap_data");

    if (!error && data) {
      const m = Array.from({ length: 7 }, () => Array(24).fill(0));
      let total = 0;
      data.forEach((row) => {
        m[row.hari][row.jam] = row.jumlah;
        total += row.jumlah;
      });
      setMatrix(m);
      setTotalPesanan(total);

      let maxVal = -1, maxHari = 0, maxJam = 0;
      let minValAktif = Infinity, minHari = 0, minJam = 8;

      m.forEach((baris, h) =>
        baris.forEach((val, j) => {
          if (val > maxVal) {
            maxVal = val;
            maxHari = h;
            maxJam = j;
          }
          // jam sepi cuma dihitung di jam operasional wajar (8-20)
          if (j >= 8 && j <= 20 && val < minValAktif) {
            minValAktif = val;
            minHari = h;
            minJam = j;
          }
        })
      );

      if (maxVal > 0) {
        setJamTersibuk({ hari: NAMA_HARI[maxHari], jam: maxJam, jumlah: maxVal });
      }
      if (minValAktif !== Infinity) {
        setJamSepi({ hari: NAMA_HARI[minHari], jam: minJam, jumlah: minValAktif });
      }
    }
    setLoading(false);
  }

  const nilaiMax = Math.max(1, ...matrix.flat());

  function warnaSel(nilai) {
    if (nilai === 0) return "var(--line)";
    const intensitas = nilai / nilaiMax;
    const alpha = 0.15 + intensitas * 0.85;
    return `rgba(13, 148, 136, ${alpha.toFixed(2)})`;
  }

  if (loadingAuth || !user) {
    return <div className="card">Memuat...</div>;
  }

  const isAdmin = profile?.role === "admin";

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Heatmap Jam Ramai</h1>
          <p className="page-subtitle">
            {isAdmin
              ? "Lihat jam & hari mana yang paling banyak pesanan masuk"
              : "Cek jam sepi biar laundry kamu lebih cepat diproses!"}
          </p>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-value">{totalPesanan}</div>
          <div className="stat-label">Total Pesanan Dianalisis</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: 18 }}>
            {jamTersibuk ? `${jamTersibuk.hari}, ${String(jamTersibuk.jam).padStart(2, "0")}.00` : "-"}
          </div>
          <div className="stat-label">🔥 Jam Paling Sibuk</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: 18 }}>
            {jamSepi ? `${jamSepi.hari}, ${String(jamSepi.jam).padStart(2, "0")}.00` : "-"}
          </div>
          <div className="stat-label">✨ Jam Paling Sepi (rekomendasi!)</div>
        </div>
      </div>

      <div className="card table-scroll">
        {loading ? (
          <div className="empty-state">Memuat data...</div>
        ) : totalPesanan === 0 ? (
          <div className="empty-state">
            <span className="empty-emoji">📊</span>
            Belum ada cukup data pesanan untuk ditampilkan.
          </div>
        ) : (
          <div className="heatmap-wrap">
            <div className="heatmap-row heatmap-header-row">
              <div className="heatmap-label"></div>
              {Array.from({ length: 24 }, (_, jam) => (
                <div key={jam} className="heatmap-jam-label">
                  {jam}
                </div>
              ))}
            </div>
            {matrix.map((baris, hari) => (
              <div key={hari} className="heatmap-row">
                <div className="heatmap-label">{NAMA_HARI[hari]}</div>
                {baris.map((nilai, jam) => (
                  <div
                    key={jam}
                    className="heatmap-cell"
                    style={{ background: warnaSel(nilai) }}
                    title={`${NAMA_HARI[hari]} jam ${jam}.00 — ${nilai} pesanan`}
                  >
                    {nilai > 0 ? nilai : ""}
                  </div>
                ))}
              </div>
            ))}
            <div className="heatmap-legend">
              <span>Sepi</span>
              <div className="heatmap-legend-gradient"></div>
              <span>Ramai</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
