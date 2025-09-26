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
  ulok_id: string; // relasi ke ulok
  karakter_lokasi: string | null;
  sosial_ekonomi: string | null;
  skor_fpl: number | null;
  std: number | null;
  apc: number | null;
  spd: number | null;
  pe_status: string | null;
  pe_rab: number | null;

  // File/URL fields
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

  // Approval fields
  kplt_approval: "IN PROGRESS" | "APPROVED" | "REJECTED";
  kplt_approved_at: string | null;
  kplt_approved_by: string | null;

  // Meta fields
  created_at: string;
  created_by: string | null;
  updated_at: string | null;
  updated_by: string | null;
}
