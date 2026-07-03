import "./globals.css";

export const metadata = {
  title: "Bersih Laundry — Manajemen Pesanan",
  description: "Aplikasi sederhana untuk mengelola pesanan laundry",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <div className="app-shell">
          <aside className="sidebar">
            <div className="brand">
              <span className="brand-mark">🧺</span>
              <span className="brand-name">Bersih Laundry</span>
            </div>
            <nav className="nav">
              <a href="/" className="nav-link">
                Pesanan
              </a>
              <a href="/pesanan/tambah" className="nav-link">
                + Pesanan Baru
              </a>
              <a href="/pelanggan" className="nav-link">
                Pelanggan
              </a>
              <a href="/layanan" className="nav-link">
                Layanan &amp; Harga
              </a>
            </nav>
          </aside>
          <main className="content">{children}</main>
        </div>
      </body>
    </html>
  );
}
