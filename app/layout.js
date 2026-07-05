"use client";

import "./globals.css";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { ThemeProvider, useTheme } from "@/lib/ThemeContext";
import { supabase } from "@/lib/supabaseClient";

// ============================================================
// GANTI 2 BARIS INI SESUAI DATA TOKO LAUNDRY KAMU
// ============================================================
const JAM_OPERASIONAL = "08.00 - 20.00 WIB, setiap hari";
const ALAMAT_TOKO = "Jl. Widas No.7A Begadung Nganjuk, Jawa Timur 64413";
const ADMIN_WA = "081231576071"; // ganti dengan nomor WA admin (format 62xxxx)

const MENU_ADMIN = [
  { href: "/", label: "Pesanan" },
  { href: "/pesanan/tambah", label: "+ Pesanan Baru", cta: true },
  { href: "/pelanggan", label: "Pelanggan" },
  { href: "/layanan", label: "Layanan & Harga" },
  { href: "/heatmap", label: "📊 Heatmap" },
];

const MENU_CUSTOMER = [
  { href: "/pesanan-saya", label: "Pesanan Saya" },
  { href: "/heatmap", label: "📊 Jam Sepi" },
];

function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();
  if (!mounted) return <div style={{ width: 38, height: 38 }} />;

  return (
    <button
      className="theme-toggle-btn"
      onClick={toggleTheme}
      type="button"
      title={theme === "dark" ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}

function Navbar() {
  const pathname = usePathname();
  const { user, profile, loading, loginGoogle, logout } = useAuth();

  const menu = profile?.role === "admin" ? MENU_ADMIN : profile?.role === "customer" ? MENU_CUSTOMER : [];

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <a href="/" className="navbar-brand">
          <span className="navbar-brand-mark">🧺</span>
          <span className="navbar-brand-name">Bersih Laundry</span>
        </a>
        <nav className="navbar-nav">
          {menu.map((item) => {
            const kelas = item.cta
              ? "navbar-cta"
              : pathname === item.href
              ? "navbar-link navbar-link-active"
              : "navbar-link";
            return (
              <a key={item.href} href={item.href} className={kelas}>
                {item.label}
              </a>
            );
          })}

          <ThemeToggle />

          {!loading && !user && (
            <button onClick={loginGoogle} className="navbar-login-btn" type="button">
              Login dengan Google
            </button>
          )}

          {!loading && user && (
            <div className="navbar-user">
              {user.user_metadata?.avatar_url && (
                <img src={user.user_metadata.avatar_url} alt="" className="navbar-avatar" />
              )}
              <span className="navbar-username">{profile?.nama || user.email}</span>
              <button onClick={logout} className="navbar-logout" type="button">
                Keluar
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

// ============================================================
// AI CHAT (chatbot FAQ sederhana, gratis, tanpa API berbayar)
// ============================================================
function balasChatbot(pertanyaan, layananList) {
  const q = pertanyaan.toLowerCase();

  if (q.includes("harga") || q.includes("biaya") || q.includes("tarif")) {
    if (!layananList || layananList.length === 0) {
      return "Maaf, daftar harga belum tersedia saat ini. Coba tanya admin langsung ya!";
    }
    const daftar = layananList
      .map((l) => `• ${l.nama}: Rp${Number(l.harga).toLocaleString("id-ID")}/${l.satuan}`)
      .join("\n");
    return `Ini daftar harga layanan kami:\n${daftar}`;
  }

  if (q.includes("jam") || q.includes("buka") || q.includes("operasional") || q.includes("tutup")) {
    return `Kami buka ${JAM_OPERASIONAL} 🕒`;
  }

  if (q.includes("alamat") || q.includes("lokasi") || q.includes("dimana toko") || q.includes("di mana")) {
    return `Alamat toko kami: ${ALAMAT_TOKO} 📍`;
  }

  if (q.includes("status") || q.includes("pesanan saya") || q.includes("udah selesai") || q.includes("sudah selesai")) {
    return 'Untuk cek status pesanan kamu secara realtime, buka menu "Pesanan Saya" di halaman ini ya! 📦';
  }

  if (q.includes("jemput") || q.includes("antar")) {
    return 'Kamu bisa pilih "Jemput di Alamat Saya" atau "Antar Sendiri ke Toko" saat bikin pesanan baru di menu Pesanan Saya 🛵';
  }

  if (q.includes("halo") || q.includes("hai") || q === "hi" || q.includes("assalamualaikum")) {
    return "Halo juga! 👋 Ada yang bisa aku bantu? Coba tanya soal harga, jam buka, atau status pesanan.";
  }

  if (q.includes("terima kasih") || q.includes("makasih") || q.includes("thanks")) {
    return "Sama-sama! Semoga harimu menyenangkan 🌟";
  }

  return "Maaf, aku belum paham pertanyaan itu 🙏 Coba tanya soal harga, jam buka, status pesanan, atau cara jemput/antar. Kalau masih bingung, chat admin langsung lewat tombol WhatsApp di bawah ya.";
}

function ChatWidget() {
  const [terbuka, setTerbuka] = useState(false);
  const [pesan, setPesan] = useState([
    { dari: "bot", teks: "Halo! 👋 Aku asisten Bersih Laundry. Tanya soal harga, jam buka, atau cara pesan ya!" },
  ]);
  const [input, setInput] = useState("");
  const [layananList, setLayananList] = useState([]);
  const bawahRef = useRef(null);

  useEffect(() => {
    if (terbuka && layananList.length === 0) {
      supabase
        .from("layanan")
        .select("nama, harga, satuan")
        .order("nama")
        .then(({ data }) => setLayananList(data || []));
    }
  }, [terbuka]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bawahRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [pesan, terbuka]);

  function kirimPesan(teks) {
    const teksBersih = teks.trim();
    if (!teksBersih) return;

    setPesan((prev) => [...prev, { dari: "user", teks: teksBersih }]);
    setInput("");

    setTimeout(() => {
      setPesan((prev) => [...prev, { dari: "bot", teks: balasChatbot(teksBersih, layananList) }]);
    }, 400);
  }

  const quickReplies = ["💰 Harga Layanan", "🕒 Jam Buka", "📦 Cek Status Pesanan", "📍 Lokasi"];

  return (
    <>
      <button className="chat-fab" onClick={() => setTerbuka((v) => !v)} type="button" title="Chat Asisten">
        {terbuka ? "✕" : "💬"}
      </button>

      {terbuka && (
        <div className="chat-window">
          <div className="chat-header">
            <span>🧺 Asisten Bersih Laundry</span>
          </div>

          <div className="chat-messages">
            {pesan.map((p, i) => (
              <div key={i} className={`chat-bubble ${p.dari === "bot" ? "chat-bubble-bot" : "chat-bubble-user"}`}>
                {p.teks}
              </div>
            ))}
            <div ref={bawahRef} />
          </div>

          <div className="chat-quickreplies">
            {quickReplies.map((q) => (
              <button key={q} className="chat-chip" onClick={() => kirimPesan(q)} type="button">
                {q}
              </button>
            ))}
          </div>

          <form
            className="chat-input-row"
            onSubmit={(e) => {
              e.preventDefault();
              kirimPesan(input);
            }}
          >
            <input
              type="text"
              placeholder="Tulis pesan..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit">Kirim</button>
          </form>

          <a
            className="chat-wa-link"
            href={`https://wa.me/${ADMIN_WA}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            💬 Chat admin langsung via WhatsApp
          </a>
        </div>
      )}
    </>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <div className="bg-blob bg-blob-1"></div>
        <div className="bg-blob bg-blob-2"></div>
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            <main className="content">{children}</main>
            <ChatWidget />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
