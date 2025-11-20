/* eslint-disable @typescript-eslint/no-unused-vars */
import { date, z } from "zod";

const emptyToUndefined = (v: unknown) =>
  v === "" || v === null ? undefined : v;
const dateString = z.preprocess(
  emptyToUndefined,
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
);
const optionalNonEmptyString = z.preprocess(
  emptyToUndefined,
  z.string().trim().min(1)
);

const detailProgressEnum = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .trim()
    .toLowerCase()
    .refine((s) => s === "belum" || s === "selesai" || s === "batal", {
      message: "must be 'Belum' | 'Selesai' | 'Batal'",
    })
    .transform((s) =>
      s === "belum" ? "Belum" : s === "selesai" ? "Selesai" : "Batal"
    )
);

export const NotarisEditableSchema = z
  .object({
    par_online: optionalNonEmptyString.optional(), // key Storage
    tanggal_par: dateString.optional(),
    validasi_legal: detailProgressEnum.optional(),
    tanggal_validasi_legal: dateString.optional(),
    tanggal_plan_notaris: dateString.optional(),
    tanggal_notaris: dateString.optional(),
    status_notaris: detailProgressEnum.optional(),
    status_pembayaran: detailProgressEnum.optional(),
    tanggal_pembayaran: dateString.optional(),
    awal_sewa: dateString.optional(),
    akhir_sewa: dateString.optional(),
  })
  .strict();

export const NotarisCreateSchema = NotarisEditableSchema;
export const NotarisUpdateSchema = NotarisEditableSchema.partial().strict();

export const NotarisApprovalSchema = z
  .object({
    final_status_notaris: z
      .string()
      .transform((s) => s.trim().toLowerCase())
      .refine((s) => s === "selesai" || s === "batal", {
        message: "final_status_notaris must be 'selesai' or 'batal'",
      }),
  })
  .strict();

export function stripServerControlledFieldsNotaris<
  T extends Record<string, unknown>
>(obj: T) {
  const {
    id,
    progress_kplt_id,
    final_status_notaris,
    tgl_selesai_notaris,
    created_at,
    updated_at,
    ...rest
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = obj as any;
  return rest as Omit<
    T,
    | "id"
    | "progress_kplt_id"
    | "final_status_notaris"
    | "tgl_selesai_notaris"
    | "created_at"
    | "updated_at"
  >;
}
