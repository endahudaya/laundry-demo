// ============================================================
// ESTIMASI WAKTU SELESAI (heuristik pintar, bukan model AI/ML)
// ============================================================
// Menghitung kira-kira jam berapa sebuah pesanan akan selesai,
// berdasarkan: jenis layanan, jumlah kg/pcs, dan berapa banyak
// pesanan lain yang masih dalam antrian (belum "selesai").

// Kecepatan proses per 1 satuan (kg/pcs), dalam menit.
// Nilai ini bisa kamu sesuaikan sendiri kalau mau lebih akurat.
function menitPerSatuan(layanan) {
  const nama = (layanan?.nama || "").toLowerCase();

  if (nama.includes("express") || nama.includes("kilat") || nama.includes("cepat")) {
    return 18; // layanan express diproses lebih cepat per kg
  }
  if (nama.includes("sepatu")) {
    return 35;
  }
  if (nama.includes("selimut") || nama.includes("bed cover") || nama.includes("bedcover")) {
    return 50;
  }
  // default: cuci kiloan reguler & lainnya
  return 40;
}

// Rata-rata waktu tambahan (menit) yang dibutuhkan tiap 1 pesanan
// lain yang masih ngantri di depannya (setup mesin, sortir, dsb).
const OVERHEAD_PER_ANTRIAN_MENIT = 20;

/**
 * Hitung estimasi durasi (menit) & jam selesai untuk sebuah pesanan.
 * @param {object} layanan - objek layanan { nama, satuan, harga }
 * @param {number} jumlah - jumlah kg/pcs pesanan ini
 * @param {number} jumlahAntrianDidepan - berapa pesanan lain yang
 *        statusnya belum "selesai" dan masuk lebih dulu
 * @param {Date} mulaiDari - waktu mulai hitung (default: sekarang)
 */
export function estimasiSelesai(layanan, jumlah, jumlahAntrianDidepan = 0, mulaiDari = new Date()) {
  const waktuProses = menitPerSatuan(layanan) * Math.max(Number(jumlah) || 1, 1);
  const waktuAntrian = jumlahAntrianDidepan * OVERHEAD_PER_ANTRIAN_MENIT;
  const totalMenit = Math.round(waktuProses + waktuAntrian);

  const selesai = new Date(mulaiDari.getTime() + totalMenit * 60000);

  return { totalMenit, selesai };
}

/**
 * Ubah jumlah menit jadi teks "X jam Y menit" yang enak dibaca.
 */
export function formatDurasi(totalMenit) {
  if (totalMenit < 60) return `${totalMenit} menit`;
  const jam = Math.floor(totalMenit / 60);
  const menit = totalMenit % 60;
  if (menit === 0) return `${jam} jam`;
  return `${jam} jam ${menit} menit`;
}

/**
 * Format jam selesai jadi teks singkat, contoh: "14.30" atau
 * "Besok, 09.15" kalau sudah lewat tengah malam.
 */
export function formatJamSelesai(tanggalSelesai, sekarang = new Date()) {
  const beda = tanggalSelesai.toDateString() !== sekarang.toDateString();
  const jam = String(tanggalSelesai.getHours()).padStart(2, "0");
  const menit = String(tanggalSelesai.getMinutes()).padStart(2, "0");
  return beda ? `Besok, ${jam}.${menit}` : `${jam}.${menit}`;
}
