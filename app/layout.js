"use client";

import "./globals.css";
import { usePathname } from "next/navigation";

const MENU = [
  { href: "/", label: "Pesanan" },
  { href: "/pesanan/tambah", label: "+ Pesanan Baru", cta: true },
  { href: "/pelanggan", label: "Pelanggan" },
  { href: "/layanan", label: "Layanan & Harga" },
];

export default function RootLayout({ children }) {
  const pathname = usePathname();

  return (
    <html lang="id">
      <body>
        <div className="bg-blob bg-blob-1"></div>
        <div className="bg-blob bg-blob-2"></div>

        <header className="navbar">
          <div className="navbar-inner">
            <a href="/" className="navbar-brand">
              <span className="navbar-brand-mark">🧺</span>
              <span className="navbar-brand-name">Bersih Laundry</span>
            </a>
            <nav className="navbar-nav">
              {MENU.map((item) => {
                const kelas = item.cta ? "navbar-cta" : (pathname === item.href ? "navbar-link navbar-link-active" : "navbar-link");
                return <a key={item.href} href={item.href} className={kelas}>{item.label}</a>;
              })}
            </nav>
          </div>
        </header>

        <main className="content">{children}</main>
      </body>
    </html>
  );
}
