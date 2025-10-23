import { z } from "zod";


function toYMD(d: Date) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// YYYY-MM-DD normalization for date columns in DB
const DateYMD = z.preprocess((val) => {
  if (val instanceof Date) return toYMD(val);
  if (typeof val === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    const d = new Date(val);
    if (!isNaN(d.getTime())) return toYMD(d);
  }
  return val;
}, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"));

// Catatan: FE cukup kirim field khusus KPLT + override opsional.
// Field yang disalin dari ULOK tidak perlu dikirim (kecuali mau override nama_kplt, lat/long, tanggal_approval_intip, file_intip).
export const KpltCreatePayloadSchema = z
  .object({
    // Override opsional dari field turunan ULOK
    nama_kplt: z.string().min(1).optional(),
    latitude: z.coerce.number().optional(),
    longitude: z.coerce.number().optional(),

    // LM fields on KPLT
    approval_intip: z.string().optional(),
    tanggal_approval_intip: DateYMD.optional(), // normalized date string for DB "date"
    file_intip: z.string().optional(),
    form_ukur: z.string().optional(),
    tanggal_ukur: DateYMD.optional(),

    is_active: z.coerce.boolean().optional(),

    // Field Wajib KPLT
    karakter_lokasi: z.string().min(1),
    sosial_ekonomi: z.string().min(1),
    skor_fpl: z.coerce.number(),
    std: z.coerce.number(),
    apc: z.coerce.number(),
    spd: z.coerce.number(),
    pe_status: z.string().min(1),
    pe_rab: z.coerce.number(),

    pdf_foto: z.string().min(1),
    counting_kompetitor: z.string().min(1),
    pdf_pembanding: z.string().min(1),
    pdf_kks: z.string().min(1),
    excel_fpl: z.string().min(1),
    excel_pe: z.string().min(1),
    pdf_form_ukur: z.string().min(1),
    video_traffic_siang: z.string().min(1),
    video_traffic_malam: z.string().min(1),
    video_360_siang: z.string().min(1),
    video_360_malam: z.string().min(1),
    peta_coverage: z.string().min(1),

    progress_toko: z.string().nullable().optional(),
  })
  .strict();

// Multipart mode (file fields become optional since they are uploaded)
export const KpltCreateMultipartSchema = KpltCreatePayloadSchema.extend({
  pdf_foto: z.string().optional(),
  counting_kompetitor: z.string().optional(),
  pdf_pembanding: z.string().optional(),
  pdf_kks: z.string().optional(),
  excel_fpl: z.string().optional(),
  excel_pe: z.string().optional(),
  pdf_form_ukur: z.string().optional(),
  video_traffic_siang: z.string().optional(),
  video_traffic_malam: z.string().optional(),
  video_360_siang: z.string().optional(),
  video_360_malam: z.string().optional(),
  peta_coverage: z.string().optional(),
}).strict();

// Update schema: everything optional for PATCH
export const KpltUpdatePayloadSchema = KpltCreatePayloadSchema.partial();

export type KpltCreatePayload = z.infer<typeof KpltCreatePayloadSchema>;
