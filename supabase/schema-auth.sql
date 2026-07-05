-- ================================================================
-- TAMBAHAN SKEMA: LOGIN GOOGLE + ROLE ADMIN/CUSTOMER
-- ================================================================
-- Jalankan SETELAH schema.sql yang pertama (jangan jalankan
-- schema.sql lagi, ini cuma TAMBAHAN).
-- Cara pakai: Supabase Dashboard -> SQL Editor -> New query ->
-- paste semua isi file ini -> RUN.
--
-- !! WAJIB: sebelum RUN, ganti tulisan
-- 'GANTI_DENGAN_EMAIL_ADMIN_KAMU@gmail.com' di bawah dengan
-- email Gmail kamu sendiri (pemilik laundry / admin).
-- ================================================================

-- 1) Tabel profil, otomatis terhubung ke akun Supabase Auth
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nama text,
  role text not null default 'customer', -- 'admin' atau 'customer'
  created_at timestamptz default now()
);

alter table profiles enable row level security;

drop policy if exists "User bisa lihat profil sendiri" on profiles;
create policy "User bisa lihat profil sendiri" on profiles
  for select using (auth.uid() = id);

drop policy if exists "User bisa update profil sendiri" on profiles;
create policy "User bisa update profil sendiri" on profiles
  for update using (auth.uid() = id);

-- 2) Hubungkan tabel pelanggan ke akun login (opsional/nullable,
-- supaya pelanggan walk-in tanpa akun tetap bisa dicatat admin)
alter table pelanggan add column if not exists user_id uuid references auth.users(id) on delete set null;

-- 3) Fungsi otomatis: begitu ada akun Google baru login pertama
-- kali, otomatis dibuatkan baris di "profiles" dan "pelanggan"
create or replace function handle_new_user()
returns trigger as $$
declare
  email_admin text := 'GANTI_DENGAN_EMAIL_ADMIN_KAMU@gmail.com'; -- <-- WAJIB GANTI
  role_baru text;
  nama_baru text;
begin
  nama_baru := coalesce(new.raw_user_meta_data->>'full_name', new.email);

  if lower(new.email) = lower(email_admin) then
    role_baru := 'admin';
  else
    role_baru := 'customer';
  end if;

  insert into profiles (id, email, nama, role)
  values (new.id, new.email, nama_baru, role_baru)
  on conflict (id) do nothing;

  if role_baru = 'customer' then
    insert into pelanggan (user_id, nama, telepon, alamat)
    values (new.id, nama_baru, '', '');
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ================================================================
-- 4) PERKETAT RLS — hapus policy lama yang "buka untuk semua",
-- ganti dengan aturan berbasis role.
-- ================================================================

-- --- pesanan ---
drop policy if exists "Izinkan semua akses pesanan" on pesanan;

create policy "Admin akses semua pesanan" on pesanan
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Customer lihat pesanan sendiri" on pesanan
  for select using (
    exists (
      select 1 from pelanggan
      where pelanggan.id = pesanan.pelanggan_id and pelanggan.user_id = auth.uid()
    )
  );

create policy "Customer buat pesanan sendiri" on pesanan
  for insert with check (
    exists (
      select 1 from pelanggan
      where pelanggan.id = pesanan.pelanggan_id and pelanggan.user_id = auth.uid()
    )
  );

-- --- pelanggan ---
drop policy if exists "Izinkan semua akses pelanggan" on pelanggan;

create policy "Admin akses semua pelanggan" on pelanggan
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Customer lihat data sendiri" on pelanggan
  for select using (auth.uid() = user_id);

create policy "Customer update data sendiri" on pelanggan
  for update using (auth.uid() = user_id);

-- --- layanan (daftar harga) ---
drop policy if exists "Izinkan semua akses layanan" on layanan;

create policy "Semua orang bisa lihat layanan" on layanan
  for select using (true);

create policy "Admin kelola layanan" on layanan
  for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admin update layanan" on layanan
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admin hapus layanan" on layanan
  for delete using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
