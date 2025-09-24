import { string, z } from "zod";

function toYMD(d: Date) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Normalisasi tanggal (YYYY-MM-DD)
const DateYMD = z.preprocess((val) => {
  if (val instanceof Date) return toYMD(val);
  if (typeof val === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    const d = new Date(val);
    if (!isNaN(d.getTime())) return toYMD(d);
  }
  return val;
}, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"));

// Normalisasi timestamp (ISO)
const TimestampISO = z.preprocess((val) => {
  if (val instanceof Date) return val.toISOString();
  if (typeof val === "string") {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  return val;
}, z.string().datetime());

export const UlokBaseSchema = z
  .object({
    nama_ulok: z.string().min(1),
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    desa_kelurahan: z.string().min(1),
    kecamatan: z.string().min(1),
    kabupaten: z.string().min(1),
    provinsi: z.string().min(1),
    alamat: z.string().min(1),
    format_store: z.string().min(1),
    bentuk_objek: z.string().min(1),
    alas_hak: z.string().min(1),
    jumlah_lantai: z.coerce.number().int().min(1),
    lebar_depan: z.coerce.number(),
    panjang: z.coerce.number(),
    luas: z.coerce.number(),
    harga_sewa: z.coerce.number(),
    nama_pemilik: z.string().min(1),
    kontak_pemilik: z.string().min(1),
    // form_ulok: z.string().min(1).optional(), form ulok diproses di server backend  
  })
  .strict();

export const UlokCreateSchema = UlokBaseSchema.extend({
  approval_intip: z.string().optional(),
  tanggal_approval_intip: DateYMD.optional(),
  file_intip: z.string().optional(),
  approval_status: string().optional(),
  approved_at: TimestampISO.optional(),
  approved_by: z.uuid().optional(),
  is_active: z.coerce.boolean().optional(),
});

export const UlokUpdateSchema = UlokCreateSchema.partial()
  .extend({
    updated_by: z.uuid().optional(),
  })
  .strict();

export type UlokCreateInput = z.infer<typeof UlokCreateSchema>;
export type UlokUpdateInput = z.infer<typeof UlokUpdateSchema>;
