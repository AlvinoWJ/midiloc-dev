/* eslint-disable @typescript-eslint/no-unused-vars */
import { z } from "zod";

// Helper: ubah "" atau null menjadi undefined (agar field opsional tidak gagal)
const emptyToUndefined = (v: unknown) =>
  v === "" || v === null ? undefined : v;

// Tanggal 'YYYY-MM-DD' (opsional) dengan preprocessor
const dateString = z.preprocess(
  emptyToUndefined,
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date string in YYYY-MM-DD")
);

// Angka opsional (double), terima number atau string angka
const optionalNumber = z.preprocess(
  emptyToUndefined,
  z.coerce.number().finite()
);

// Integer opsional
const optionalInt = z.preprocess(emptyToUndefined, z.coerce.number().int());

// String opsional non-kosong (auto-trim)
const optionalNonEmptyString = z.preprocess(
  emptyToUndefined,
  z.string().trim().min(1)
);

// Field yang boleh diubah via CRUD (final_status_mou DIKECUALIKAN)
export const MouEditableSchema = z
  .object({
    tanggal_mou: dateString.optional(),
    nama_pemilik_final: optionalNonEmptyString.optional(),
    periode_sewa: optionalInt.optional(),
    nilai_sewa: optionalNumber.optional(),
    status_pajak: optionalNonEmptyString.optional(),
    pembayaran_pph: optionalNonEmptyString.optional(),
    cara_pembayaran: optionalNonEmptyString.optional(),
    grace_period: optionalInt.optional(),
    harga_final: optionalNumber.optional(),
    keterangan: z.preprocess(emptyToUndefined, z.string()).optional(),
    // ISO timestamp; di CRUD boleh opsional, di approval diisi server
    tgl_selesai: z
      .preprocess(emptyToUndefined, z.string().datetime())
      .optional(),
  })
  .strict();

export const MouCreateSchema = MouEditableSchema;
export const MouUpdateSchema = MouEditableSchema.partial().strict();

// Approval: terima "selesai"/"batal" (case-insensitive), normalisasi ke "Selesai"/"Batal"
const FinalStatusApprovalInput = z
  .string()
  .min(1)
  .transform((s) => s.trim().toLowerCase())
  .refine((s) => s === "selesai" || s === "batal", {
    message: "final_status_mou must be 'selesai' or 'batal'",
  })
  .transform((s) => (s === "selesai" ? "Selesai" : "Batal"));

export const MouApprovalSchema = z
  .object({
    final_status_mou: FinalStatusApprovalInput,
  })
  .strict();

// Utility: buang field yang dikontrol server
export function stripServerControlledFields<T extends Record<string, unknown>>(
  obj: T
) {
  const {
    id,
    progress_kplt_id,
    final_status_mou,
    created_at,
    updated_at,
    tgl_selesai,
    ...rest
  } = obj as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  return rest as Omit<
    T,
    | "id"
    | "progress_kplt_id"
    | "final_status_mou"
    | "created_at"
    | "updated_at"
    | "tgl_selesai"
  >;
}
