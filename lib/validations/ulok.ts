import { z } from "zod";

// Normalisasi timestamp (ISO)
const TimestampISO = z.preprocess((val) => {
  if (val instanceof Date) return val.toISOString();
  if (typeof val === "string") {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  return val;
}, z.string().datetime());

// (Opsional) Enum sesuai alur
export const UlokApprovalStatus = z.enum(["In Progress", "OK", "NOK"]);

export const UlokBaseSchema = z
  .object({
    nama_ulok: z.string().min(1),
    latitude: z.coerce.number().min(-90).max(90).finite(),
    longitude: z.coerce.number().min(-180).max(180).finite(),
    desa_kelurahan: z.string().min(1),
    kecamatan: z.string().min(1),
    kabupaten: z.string().min(1),
    provinsi: z.string().min(1),
    alamat: z.string().min(1),
    format_store: z.string().min(1),
    bentuk_objek: z.string().min(1),
    alas_hak: z.string().min(1),
    jumlah_lantai: z.coerce.number().int().min(1).finite(),
    lebar_depan: z.coerce.number().nonnegative().finite(),
    panjang: z.coerce.number().nonnegative().finite(),
    luas: z.coerce.number().nonnegative().finite(),
    harga_sewa: z.coerce.number().nonnegative().finite(),
    nama_pemilik: z.string().min(1),
    kontak_pemilik: z.string().min(1),
    form_ulok: z.instanceof(File),
  })
  .strict();

export const UlokCreateSchema = UlokBaseSchema.extend({
  // Ganti ke enum bila memungkinkan, kalau belum siap tetap bisa z.string().optional()
  approval_status: UlokApprovalStatus.optional(),
  approved_at: TimestampISO.optional(),
  approved_by: z.uuid().optional(),
});

export const UlokUpdateSchema = UlokCreateSchema.partial()
  .extend({
    updated_by: z.uuid().optional(),
  })
  .strict();

// Schema khusus untuk LM approval (dipakai di endpoint LM)
export const UlokLMApprovalSchema = z
  .object({
    approval_status: UlokApprovalStatus,
  })
  .strict();

export type UlokCreateInput = z.infer<typeof UlokCreateSchema>;
export type UlokUpdateInput = z.infer<typeof UlokUpdateSchema>;
