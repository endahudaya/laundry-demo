export function formatRupiah(angka) {
  const num = Number(angka) || 0;
  const bulat = Math.round(num);
  // format manual (bukan Intl.NumberFormat) supaya hasil SELALU sama
  // antara render di server (Node) dan di browser — menghindari
  // hydration error "Text content does not match".
  const dipisah = bulat
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `Rp${dipisah}`;
}

export const DAFTAR_STATUS = [
  { value: "menunggu_dijemput", label: "Menunggu Dijemput", color: "#ea580c" },
  { value: "diterima", label: "Diterima", color: "#6b7280" },
  { value: "dicuci", label: "Sedang Dicuci", color: "#2563eb" },
  { value: "disetrika", label: "Sedang Disetrika", color: "#7c3aed" },
  { value: "siap_diambil", label: "Siap Diambil", color: "#d97706" },
  { value: "selesai", label: "Selesai / Diambil", color: "#059669" },
];

export function labelStatus(value) {
  const found = DAFTAR_STATUS.find((s) => s.value === value);
  return found ? found.label : value;
}

export function warnaStatus(value) {
  const found = DAFTAR_STATUS.find((s) => s.value === value);
  return found ? found.color : "#6b7280";
}

export function formatTanggal(tanggal) {
  if (!tanggal) return "-";
  const d = new Date(tanggal);
  const hari = String(d.getDate()).padStart(2, "0");
  const bulanNama = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ][d.getMonth()];
  const tahun = d.getFullYear();
  const jam = String(d.getHours()).padStart(2, "0");
  const menit = String(d.getMinutes()).padStart(2, "0");
  return `${hari} ${bulanNama} ${tahun}, ${jam}.${menit}`;
}
