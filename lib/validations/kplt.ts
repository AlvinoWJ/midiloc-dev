import { z } from "zod";

// Catatan: FE cukup kirim field khusus KPLT + override opsional.
// Field yang disalin dari ULOK tidak perlu dikirim (kecuali mau override nama_kplt, lat/long, tanggal_approval_intip, file_intip).
export const KpltCreatePayloadSchema = z
  .object({
    // Override opsional dari field turunan ULOK
    nama_kplt: z.string().min(1).optional(),
    latitude: z.coerce.number().optional(),
    longitude: z.coerce.number().optional(),
    tanggal_approval_intip: z.coerce.date().optional(),
    file_intip: z.string().optional(),
    is_active: z.boolean().optional(),

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

export type KpltCreatePayload = z.infer<typeof KpltCreatePayloadSchema>;
