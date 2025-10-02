// types/kplt.ts
import type {
  KpltCreateInput,
  KpltCreateWithUlokIdInput,
  KpltUpdateLsInput,
  KpltLmApprovalInput,
} from "@/lib/validations/kplt";

export type {
  KpltCreateInput,
  KpltCreateWithUlokIdInput,
  KpltUpdateLsInput,
  KpltLmApprovalInput,
};

// Representasi 1 baris data KPLT di database
export interface KpltRow {
  id: string;
  ulok_id: string;
  karakter_lokasi: string | null;
  sosial_ekonomi: string | null;
  skor_fpl: number | null;
  std: number | null;
  apc: number | null;
  spd: number | null;
  pe_status: string | null;
  pe_rab: number | null;

  // File/URL
  pdf_foto: string | null;
  counting_kompetitor: string | null;
  pdf_pembanding: string | null;
  pdf_kks: string | null;
  excel_fpl: string | null;
  excel_pe: string | null;
  pdf_form_ukur: string | null;
  video_traffic_siang: string | null;
  video_traffic_malam: string | null;
  video_360_siang: string | null;
  video_360_malam: string | null;
  peta_coverage: string | null;

  progress_toko: string | null;
  is_active: boolean;

  // Approval
  kplt_approval: "IN PROGRESS" | "APPROVED" | "REJECTED";
  kplt_approved_at: string | null;
  kplt_approved_by: string | null;

  // Meta
  created_at: string;
  created_by: string | null;
  updated_at: string | null;
  updated_by: string | null;
}

// Data dasar dari API prefill
export type KpltBaseData = {
  luas: number;
  alamat: string;
  panjang: number;
  alas_hak: string;
  latitude: string;
  provinsi: string;
  form_ulok: string | null;
  is_active: boolean;
  kabupaten: string;
  kecamatan: string;
  longitude: string;
  nama_kplt: string;
  file_intip: string | null;
  harga_sewa: number;
  lebar_depan: number;
  bentuk_objek: string;
  format_store: string;
  nama_pemilik: string;
  jumlah_lantai: number;
  desa_kelurahan: string;
  kontak_pemilik: string;
  approval_intip_status: string;
  tanggal_approval_intip: string | null;
};

// Response dari API prefill
export type PrefillKpltResponse = {
  base: KpltBaseData;
  ulok_id: string;
  exists_kplt: boolean;
};

// Data hasil mapping siap pakai di UI
export interface MappedKpltData {
  id: string;
  ulokId: string;
  karakterLokasi: string;
  sosialEkonomi: string;
  skorFpl: number;
  std: number;
  apc: number;
  spd: number;
  peStatus: string;
  peRab: number;

  pdfFoto: string;
  countingKompetitor: string;
  pdfPembanding: string;
  pdfKks: string;
  excelFpl: string;
  excelPe: string;
  pdfFormUkur: string;
  videoTrafficSiang: string;
  videoTrafficMalam: string;
  video360Siang: string;
  video360Malam: string;
  petaCoverage: string;

  progressToko: string;
  isActive: boolean;

  approval: "IN PROGRESS" | "APPROVED" | "REJECTED";
  approvedAt: string;
  approvedBy: string;

  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}
