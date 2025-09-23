import { z } from "zod";

// Helper umum
const NonEmptyString = z.string().trim().min(1);
const UrlString = z.string().url();
const Num = z.coerce.number();

// Field dasar KPLT yang bisa diisi oleh client (tidak termasuk field server-managed)
const KpltBaseFields = z
  .object({
    karakter_lokasi: NonEmptyString.optional(),
    sosial_ekonomi: NonEmptyString.optional(),
    skor_fpl: Num.optional(),
    std: Num.optional(),
    apc: Num.optional(),
    spd: Num.optional(),
    pe_status: NonEmptyString.optional(),
    pe_rab: Num.optional(),

    // File/URL fields (opsional, jika diisi harus URL valid)
    pdf_foto: UrlString.optional(),
    counting_kompetitor: UrlString.optional(), // bebas string
    pdf_pembanding: UrlString.optional(),
    pdf_kks: UrlString.optional(),
    excel_fpl: UrlString.optional(),
    excel_pe: UrlString.optional(),
    pdf_form_ukur: UrlString.optional(),
    video_traffic_siang: UrlString.optional(),
    video_traffic_malam: UrlString.optional(),
    video_360_siang: UrlString.optional(),
    video_360_malam: UrlString.optional(),
    peta_coverage: UrlString.optional(),

    progress_toko: NonEmptyString.optional(),
    is_active: z.boolean().optional(),
  })
  .strict();

// Create schema (nested route): body TANPA ulok_id, karena ulok_id dari path param
export const KpltCreateSchema = KpltBaseFields.strict();
export type KpltCreateInput = z.infer<typeof KpltCreateSchema>;

// Create schema (non-nested route): body DENGAN ulok_id (wajib)
export const KpltCreateWithUlokIdSchema = KpltBaseFields.extend({
  ulok_id: z.string(),
}).strict();
export type KpltCreateWithUlokIdInput = z.infer<
  typeof KpltCreateWithUlokIdSchema
>;

// Update schema untuk Location Specialist (LS):
// - Semua field pada base boleh diubah (kecuali yang sudah Anda blokir di handler: id, ulok_id, branch_id, approval fields, dst.)
// - Minimal 1 field harus dikirim
export const KpltUpdateLsSchema = KpltBaseFields.strict().refine(
  (obj) => Object.keys(obj).length > 0,
  { message: "Minimal 1 field untuk diupdate." }
);
export type KpltUpdateLsInput = z.infer<typeof KpltUpdateLsSchema>;

// Update schema untuk Location Manager (LM) — fokus approval fields saja
// Jika Anda punya enum untuk status approval, ganti ke z.enum([...]) sesuai enum DB Anda.
export const KpltApprovalSchema = z
  .object({
    kplt_approval: z.string().optional(), // contoh: "In Progress" | "APPROVED" | "REJECTED"
    kplt_approved_at: z.string().optional(),
    kplt_approved_by: z.string().optional(),
  })
  .strict()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "Minimal 1 approval field untuk diupdate.",
  });
export type KpltLmApprovalInput = z.infer<typeof KpltApprovalSchema>;
