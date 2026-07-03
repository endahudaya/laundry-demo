# 🧺 Bersih Laundry — Aplikasi Manajemen Laundry

Aplikasi sederhana untuk mencatat pesanan laundry, dibuat dengan:
- **Next.js 14** (App Router) — sekaligus jadi frontend & backend (lewat Supabase client)
- **Supabase** — database (PostgreSQL) + API otomatis

Fitur:
- Tambah/lihat/hapus **pesanan**, ubah **status** (Diterima → Dicuci → Disetrika → Siap Diambil → Selesai)
- Kelola **pelanggan**
- Kelola **layanan & harga** (misal: Cuci Kiloan Reguler Rp7.000/kg)
- Total harga pesanan dihitung otomatis

---

## 📁 Struktur Project

```
laundry-app/
├── app/
│   ├── layout.js              # Layout utama + sidebar navigasi
│   ├── page.js                 # Halaman dashboard (daftar pesanan)
│   ├── globals.css             # Semua styling
│   ├── pesanan/tambah/page.js  # Form tambah pesanan
│   ├── pelanggan/page.js       # Kelola pelanggan
│   └── layanan/page.js         # Kelola layanan & harga
├── lib/
│   ├── supabaseClient.js       # Koneksi ke Supabase
│   └── format.js                # Helper format Rupiah, tanggal, status
├── supabase/
│   └── schema.sql               # SQL untuk membuat tabel di Supabase
├── .env.local.example
├── jsconfig.json
├── next.config.js
└── package.json
```

---

## 🚀 PANDUAN LENGKAP: Dari sini ke VSCode sampai Jalan

Ikuti urut-urutan ini persis, jangan diloncat, supaya tidak error.

### Langkah 1 — Pastikan Node.js sudah terinstall

Buka terminal/CMD, ketik:
```bash
node -v
npm -v
```
Kalau muncul versi (misal `v18.x` atau `v20.x`), lanjut ke langkah 2.
Kalau error "command not found", install dulu Node.js versi **LTS** dari:
👉 https://nodejs.org (pilih tombol yang tulisannya "LTS")

Setelah install, **tutup dan buka lagi** terminal/VSCode, baru cek ulang `node -v`.

---

### Langkah 2 — Pindahkan folder project ke komputer kamu

1. Download/extract folder `laundry-app` yang saya buatkan ini ke lokasi yang mudah diingat, misalnya `D:\project\laundry-app` (Windows) atau `~/project/laundry-app` (Mac/Linux).
2. Buka **VSCode**.
3. Klik menu **File → Open Folder...** lalu pilih folder `laundry-app` tersebut.
4. Buka terminal di dalam VSCode: menu **Terminal → New Terminal** (atau shortcut `` Ctrl+` ``).

---

### Langkah 3 — Install semua dependency

Di terminal VSCode (pastikan posisi folder sudah di dalam `laundry-app`), jalankan:

```bash
npm install
```

Tunggu sampai selesai (akan muncul folder baru `node_modules`). Ini proses normal, biasanya 1-3 menit.

> ⚠️ Kalau muncul error terkait permission (khusus Mac/Linux), coba jalankan `sudo npm install`. Kalau di Windows muncul error "execution policy", buka PowerShell **as Administrator** lalu jalankan:
> ```bash
> Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```
> lalu coba `npm install` lagi.

---

### Langkah 4 — Buat project Supabase

1. Buka https://supabase.com lalu **Sign up / Login** (bisa pakai akun GitHub).
2. Klik **New Project**.
3. Isi:
   - **Name**: `laundry-app` (bebas)
   - **Database Password**: buat password, **simpan baik-baik**
   - **Region**: pilih yang paling dekat (misal Singapore)
4. Klik **Create new project**, tunggu ± 1-2 menit sampai project siap (statusnya berubah jadi hijau/aktif).

---

### Langkah 5 — Buat tabel database (jalankan file `schema.sql`)

1. Di dashboard Supabase project kamu, klik menu **SQL Editor** di sidebar kiri.
2. Klik **New query**.
3. Buka file `supabase/schema.sql` yang ada di project ini (di VSCode), **copy semua isinya**.
4. **Paste** ke SQL Editor Supabase tadi.
5. Klik tombol **Run** (atau `Ctrl+Enter`).
6. Kalau berhasil akan muncul tulisan "Success. No rows returned". Ini artinya 3 tabel sudah dibuat: `pelanggan`, `layanan`, `pesanan`, lengkap dengan 4 contoh data layanan.

Cek hasilnya: klik menu **Table Editor** di sidebar, harus muncul tabel `pelanggan`, `layanan`, `pesanan`.

---

### Langkah 6 — Ambil API Key Supabase

1. Di dashboard Supabase, klik ikon **⚙️ Project Settings** (pojok kiri bawah) → **API**.
2. Kamu akan lihat:
   - **Project URL** → contoh: `https://abcdefgh.supabase.co`
   - **Project API keys** → bagian **anon / public** (bukan `service_role`, jangan yang itu!)
3. Copy kedua nilai ini, kita pakai di langkah berikutnya.

---

### Langkah 7 — Hubungkan project Next.js ke Supabase

1. Di VSCode, cari file `.env.local.example` di root folder.
2. **Duplikat** file tersebut, lalu ubah nama duplikatnya jadi `.env.local` (harus persis, pakai titik di depan).
   - Cara cepat lewat terminal:
     ```bash
     cp .env.local.example .env.local
     ```
     (di Windows CMD pakai: `copy .env.local.example .env.local`)
3. Buka file `.env.local`, isi dengan data dari Langkah 6:

```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9......
```

4. **Simpan file** (`Ctrl+S`).

> 🔒 File `.env.local` **tidak akan ter-upload ke Git** (sudah diatur di `.gitignore`), jadi API key kamu aman.

---

### Langkah 8 — Jalankan aplikasi

Di terminal VSCode:

```bash
npm run dev
```

Tunggu sampai muncul tulisan seperti:
```
▲ Next.js 14.2.15
- Local:        http://localhost:3000
```

Buka browser, akses **http://localhost:3000** → aplikasi laundry kamu sudah jalan dan terhubung ke Supabase! 🎉

Coba:
1. Buka menu **Layanan & Harga** → pastikan 4 layanan contoh sudah muncul.
2. Buka menu **Pelanggan** → tambah 1 pelanggan baru.
3. Buka menu **+ Pesanan Baru** → buat pesanan untuk pelanggan tadi.
4. Kembali ke halaman **Pesanan** (menu paling atas) → pesanan baru harus muncul, coba ubah status-nya lewat dropdown.

---

## 🐛 Troubleshooting Error Umum

| Error | Penyebab | Solusi |
|---|---|---|
| `Module not found: Can't resolve '@/lib/supabaseClient'` | `node_modules` belum ter-install atau `jsconfig.json` hilang | Pastikan sudah `npm install` dan file `jsconfig.json` ada di root folder |
| Data tidak muncul / kosong terus, tapi tidak ada pesan error jelas | `.env.local` belum diisi / salah isi | Cek ulang Langkah 7, pastikan tidak ada spasi tambahan, restart `npm run dev` setelah edit `.env.local` |
| `permission denied for table pesanan` atau sejenisnya | Row Level Security (RLS) belum diatur policy-nya | Pastikan seluruh isi `schema.sql` sudah dijalankan (termasuk bagian `create policy`) |
| `fetch failed` / `Failed to fetch` | Salah copy Project URL/API Key, atau project Supabase masih "paused" | Cek ulang Project URL & anon key di Supabase Settings → API. Project gratis akan "sleep" setelah tidak dipakai lama, buka dashboard-nya untuk membangunkan lagi |
| Setelah edit `.env.local` perubahan tidak kelihatan | Next.js hanya membaca `.env.local` saat start | Hentikan server (`Ctrl+C` di terminal) lalu `npm run dev` lagi |
| Halaman putih / error React saat `npm run dev` | Biasanya salah ketik / cache lama | Hapus folder `.next` lalu jalankan `npm run dev` lagi: `rm -rf .next` (Mac/Linux) atau hapus manual folder `.next` di VSCode (Windows) |

---

## ➕ Pengembangan Selanjutnya (opsional)

Beberapa ide kalau mau lanjut mengembangkan:
- Tambah halaman **cetak nota/struk** pesanan
- Tambah **login admin** pakai Supabase Auth
- Tambah **filter & pencarian** pesanan berdasarkan status/tanggal
- Deploy ke **Vercel** (gratis) — tinggal push ke GitHub, connect ke https://vercel.com, lalu isi environment variable yang sama seperti `.env.local` di dashboard Vercel

Selamat mencoba! 🧼
