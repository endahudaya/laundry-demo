export function formatRupiah(angka) {
  if (angka === null || angka === undefined) return "Rp0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
}

export const DAFTAR_STATUS = [
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
  return new Date(tanggal).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
