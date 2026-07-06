// ============================================================
// ESTIMASI WAKTU SELESAI (heuristik pintar, bukan model AI/ML)
// ============================================================
// Sekarang MEMPERHITUNGKAN JAM OPERASIONAL TOKO — proses dianggap
// cuma jalan pas toko buka, dan "berhenti" pas toko tutup, lanjut
// lagi besok pas buka.

// ============================================================
// GANTI 2 ANGKA INI KALAU JAM OPERASIONAL TOKO KAMU BEDA.
// Harus SAMA dengan JAM_OPERASIONAL yang ditulis di app/layout.js
// ============================================================
const JAM_BUKA = 8;   // jam 08.00
const JAM_TUTUP = 20; // jam 20.00 (8 malam)

// Waktu dasar standar per jenis layanan (dalam JAM KERJA, bukan jam
// kalender), sesuai perkiraan umum bisnis laundry di Indonesia.
function jamDasarLayanan(layanan) {
  const nama = (layanan?.nama || "").toLowerCase();

  if (
    nama.includes("express") ||
    nama.includes("kilat") ||
    nama.includes("cepat") ||
    nama.includes("1 hari")
  ) {
    return 24;
  }
  if (nama.includes("sepatu")) {
    return 24;
  }
  if (nama.includes("selimut") || nama.includes("bed cover") || nama.includes("bedcover")) {
    return 48;
  }
  return 48;
}

const OVERHEAD_PER_ANTRIAN_JAM = 3;
const JAM_TAMBAHAN_PER_5_SATUAN = 2;

/**
 * Majukan waktu sejumlah "menit kerja", tapi cuma menghitung jam
 * yang masuk rentang JAM_BUKA - JAM_TUTUP. Kalau kelebihan, lanjut
 * ke hari berikutnya mulai dari JAM_BUKA lagi (melompati malam).
 */
function tambahkanWaktuOperasional(mulaiDari, totalMenitKerja) {
  let waktu = new Date(mulaiDari);

  function jamDesimal(d) {
    return d.getHours() + d.getMinutes() / 60;
  }

  // Kalau mulai di luar jam operasional, majukan dulu ke jam buka berikutnya
  if (jamDesimal(waktu) < JAM_BUKA) {
    waktu.setHours(JAM_BUKA, 0, 0, 0);
  } else if (jamDesimal(waktu) >= JAM_TUTUP) {
    waktu.setDate(waktu.getDate() + 1);
    waktu.setHours(JAM_BUKA, 0, 0, 0);
  }

  let sisaMenit = totalMenitKerja;

  while (sisaMenit > 0) {
    const menitSampaiTutupHariIni = (JAM_TUTUP - jamDesimal(waktu)) * 60;

    if (sisaMenit <= menitSampaiTutupHariIni) {
      waktu = new Date(waktu.getTime() + sisaMenit * 60000);
      sisaMenit = 0;
    } else {
      sisaMenit -= menitSampaiTutupHariIni;
      waktu.setDate(waktu.getDate() + 1);
      waktu.setHours(JAM_BUKA, 0, 0, 0);
    }
  }

  return waktu;
}

/**
 * Hitung estimasi jam selesai untuk sebuah pesanan, dengan
 * mempertimbangkan jam operasional toko.
 */
export function estimasiSelesai(layanan, jumlah, jumlahAntrianDidepan = 0, mulaiDari = new Date()) {
  const jamDasar = jamDasarLayanan(layanan);
  const jamAntrian = jumlahAntrianDidepan * OVERHEAD_PER_ANTRIAN_JAM;

  const jumlahNum = Math.max(Number(jumlah) || 1, 1);
  const jamBeban = Math.floor(jumlahNum / 5) * JAM_TAMBAHAN_PER_5_SATUAN;

  const totalJamKerja = jamDasar + jamAntrian + jamBeban;
  const totalMenitKerja = Math.round(totalJamKerja * 60);

  const selesai = tambahkanWaktuOperasional(mulaiDari, totalMenitKerja);

  // totalMenit yang ditampilkan ke user = selisih waktu KALENDER
  // asli (termasuk lewatin malam), bukan cuma jam kerja bersih —
  // ini yang lebih masuk akal buat customer baca "sekitar X hari lagi".
  const totalMenit = Math.round((selesai.getTime() - mulaiDari.getTime()) / 60000);

  return { totalMenit, selesai };
}

/**
 * Ubah jumlah menit jadi teks "X hari Y jam" atau "X jam Y menit".
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
 * Format jam/tanggal selesai jadi teks singkat.
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
