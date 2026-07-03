import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase belum dikonfigurasi. Pastikan file .env.local sudah diisi (lihat .env.local.example)."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
