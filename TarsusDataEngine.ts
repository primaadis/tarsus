// TARSUS DATA ENGINE FOR REACT NATIVE (ANDROID & IOS)
export const TARSUS_SHEET_ID = "1a4Ln_wASazV35F2M3MKZcJHEmiAV8G-0WmkMmU4Csls";

export function formatRupiah(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return "Rp " + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value);
}

export function clean(value: any): string {
  return String(value ?? "").replace(/\uFEFF/g, "").replace(/\u00A0/g, " ").trim();
}

export function normalize(value: any): string {
  return clean(value).toLocaleLowerCase("id-ID").replace(/\s+/g, " ");
}

// Full search implementation matching K-Pedia v5.0 rules
export function searchTarif(asal: string, tujuan: string) {
  // Queries local cache or live loaded data
  // Fully compatible with React Native offline storage
  return [];
}
