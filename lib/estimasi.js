// ============================================================
// ESTIMASI WAKTU SELESAI (heuristik pintar, bukan model AI/ML)
// ============================================================
// Dihitung dalam JAM (bukan menit), karena laundry beneran itu
// prosesnya cuci + KERING (paling makan waktu) + setrika, bukan
// cuma proses cuci doang yang cuma hitungan menit.

// Waktu dasar standar per jenis layanan (dalam JAM), sesuai
// perkiraan umum bisnis laundry kiloan/express di Indonesia.
// Sesuaikan sendiri angka ini kalau laundry kamu beda standarnya.
function jamDasarLayanan(layanan) {
  const nama = (layanan?.nama || "").toLowerCase();

  if (
    nama.includes("express") ||
    nama.includes("kilat") ||
    nama.includes("cepat") ||
    nama.includes("1 hari")
  ) {
    return 24; // layanan express: selesai dalam 1 hari
  }
  if (nama.includes("sepatu")) {
    return 24;
  }
  if (nama.includes("selimut") || nama.includes("bed cover") || nama.includes("bedcover")) {
    return 48; // lebih tebal, lebih lama proses keringnya
  }
  // default: cuci kiloan reguler & lainnya -> standar 2 hari
  return 48;
}

// Tiap 1 pesanan lain yang masih ngantri di depan, nambah beban
// antrian mesin cuci/kering (dalam jam).
const OVERHEAD_PER_ANTRIAN_JAM = 3;

// Kalau jumlahnya banyak banget (per 5kg/pcs), butuh siklus mesin
// tambahan, nambah beberapa jam lagi.
const JAM_TAMBAHAN_PER_5_SATUAN = 2;

/**
 * Hitung estimasi durasi (menit) & jam selesai untuk sebuah pesanan.
 */
export function estimasiSelesai(layanan, jumlah, jumlahAntrianDidepan = 0, mulaiDari = new Date()) {
  const jamDasar = jamDasarLayanan(layanan);
  const jamAntrian = jumlahAntrianDidepan * OVERHEAD_PER_ANTRIAN_JAM;

  const jumlahNum = Math.max(Number(jumlah) || 1, 1);
  const jamBeban = Math.floor(jumlahNum / 5) * JAM_TAMBAHAN_PER_5_SATUAN;

  const totalJam = jamDasar + jamAntrian + jamBeban;
  const totalMenit = Math.round(totalJam * 60);

  const selesai = new Date(mulaiDari.getTime() + totalMenit * 60000);

  return { totalMenit, selesai };
}

/**
 * Ubah jumlah menit jadi teks "X hari Y jam" atau "X jam Y menit"
 * yang enak dibaca, otomatis pilih satuan yang pas.
 */
export function formatDurasi(totalMenit) {
  const totalJam = totalMenit / 60;

  if (totalJam < 24) {
    const jam = Math.floor(totalJam);
    const menit = Math.round((totalJam - jam) * 60);
    if (jam === 0) return `${menit} menit`;
    if (menit === 0) return `${jam} jam`;
    return `${jam} jam ${menit} menit`;
  }

  const hari = Math.floor(totalJam / 24);
  const sisaJam = Math.round(totalJam % 24);
  if (sisaJam === 0) return `${hari} hari`;
  return `${hari} hari ${sisaJam} jam`;
}

/**
 * Format jam/tanggal selesai jadi teks singkat:
 * - hari ini -> "14.30"
 * - besok -> "Besok, 09.15"
 * - lebih dari besok -> "Selasa, 07 Jul • 14.30"
 */
export function formatJamSelesai(tanggalSelesai, sekarang = new Date()) {
  const jam = String(tanggalSelesai.getHours()).padStart(2, "0");
  const menit = String(tanggalSelesai.getMinutes()).padStart(2, "0");
  const jamMenit = `${jam}.${menit}`;

  const mulaiHariIni = new Date(sekarang.getFullYear(), sekarang.getMonth(), sekarang.getDate());
  const mulaiHariSelesai = new Date(
    tanggalSelesai.getFullYear(),
    tanggalSelesai.getMonth(),
    tanggalSelesai.getDate()
  );
  const bedaHari = Math.round((mulaiHariSelesai - mulaiHariIni) / 86400000);

  if (bedaHari === 0) return jamMenit;
  if (bedaHari === 1) return `Besok, ${jamMenit}`;

  const namaHari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][
    tanggalSelesai.getDay()
  ];
  const namaBulan = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ][tanggalSelesai.getMonth()];

  return `${namaHari}, ${tanggalSelesai.getDate()} ${namaBulan} • ${jamMenit}`;
}
