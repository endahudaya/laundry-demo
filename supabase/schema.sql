-- =========================================================
-- SKEMA DATABASE APLIKASI LAUNDRY
-- Cara pakai: buka Supabase Dashboard -> SQL Editor -> New query
-- lalu paste seluruh isi file ini -> klik RUN
-- =========================================================

-- Tabel pelanggan
create table if not exists pelanggan (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  telepon text,
  alamat text,
  created_at timestamptz default now()
);

-- Tabel layanan (jenis cucian & harga)
create table if not exists layanan (
  id uuid primary key default gen_random_uuid(),
  nama text not null,             -- contoh: "Cuci Kiloan Reguler"
  satuan text not null default 'kg', -- kg / pcs / item
  harga numeric not null default 0,  -- harga per satuan
  created_at timestamptz default now()
);

-- Tabel pesanan / transaksi laundry
create table if not exists pesanan (
  id uuid primary key default gen_random_uuid(),
  pelanggan_id uuid references pelanggan(id) on delete set null,
  layanan_id uuid references layanan(id) on delete set null,
  jumlah numeric not null default 1,      -- berat (kg) atau jumlah pcs
  total_harga numeric not null default 0,
  status text not null default 'diterima', -- diterima, dicuci, disetrika, siap_diambil, selesai
  catatan text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index untuk mempercepat pencarian
create index if not exists idx_pesanan_status on pesanan(status);
create index if not exists idx_pesanan_pelanggan on pesanan(pelanggan_id);

-- =========================================================
-- ROW LEVEL SECURITY (RLS)
-- Supabase secara default mengunci akses tabel baru dari luar.
-- Untuk project belajar/simple ini kita izinkan akses publik
-- via anon key (cukup untuk demo). Untuk produksi sungguhan,
-- sebaiknya tambahkan autentikasi & policy yang lebih ketat.
-- =========================================================

alter table pelanggan enable row level security;
alter table layanan enable row level security;
alter table pesanan enable row level security;

create policy "Izinkan semua akses pelanggan" on pelanggan
  for all using (true) with check (true);

create policy "Izinkan semua akses layanan" on layanan
  for all using (true) with check (true);

create policy "Izinkan semua akses pesanan" on pesanan
  for all using (true) with check (true);

-- =========================================================
-- DATA CONTOH (opsional, boleh dihapus/diubah)
-- =========================================================

insert into layanan (nama, satuan, harga) values
  ('Cuci Kiloan Reguler', 'kg', 7000),
  ('Cuci Kiloan Express (1 hari)', 'kg', 12000),
  ('Cuci Sepatu', 'pcs', 25000),
  ('Cuci Selimut / Bed Cover', 'pcs', 20000)
on conflict do nothing;
