"use client";

import "./globals.css";
import { usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/AuthContext";

const MENU_ADMIN = [
  { href: "/", label: "Pesanan" },
  { href: "/pesanan/tambah", label: "+ Pesanan Baru", cta: true },
  { href: "/pelanggan", label: "Pelanggan" },
  { href: "/layanan", label: "Layanan & Harga" },
];

const MENU_CUSTOMER = [{ href: "/pesanan-saya", label: "Pesanan Saya" }];

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

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <div className="bg-blob bg-blob-1"></div>
        <div className="bg-blob bg-blob-2"></div>
        <AuthProvider>
          <Navbar />
          <main className="content">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
