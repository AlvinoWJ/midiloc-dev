/* eslint-disable @typescript-eslint/no-unused-vars */
import { z } from "zod";

const emptyToUndefined = (v: unknown) =>
  v === "" || v === null ? undefined : v;
const dateString = z.preprocess(
  emptyToUndefined,
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
);
const optionalNumber = z.preprocess(
  emptyToUndefined,
  z.coerce.number().finite()
);
const optionalNonEmptyString = z.preprocess(
  emptyToUndefined,
  z.string().trim().min(1)
);

export const ITEditableSchema = z
  .object({
    nominal: optionalNumber.optional(),
    tanggal_terbit: dateString.optional(),
    file_izin_tetangga: optionalNonEmptyString.optional(),
    file_bukti_pembayaran: optionalNonEmptyString.optional(),
  })
  .strict();

export const ITCreateSchema = ITEditableSchema;
export const ITUpdateSchema = ITEditableSchema.partial().strict();

export const ITApprovalSchema = z
  .object({
    final_status_it: z
      .string()
      .transform((s) => s.trim().toLowerCase())
      .refine((s) => s === "selesai" || s === "batal", {
        message: "final_status_it must be 'selesai' or 'batal'",
      }),
  })
  .strict();

export function stripServerControlledFieldsIT<
  T extends Record<string, unknown>
>(obj: T) {
  const {
    id,
    progress_kplt_id,
    final_status_it,
    tgl_selesai_izintetangga,
    created_at,
    updated_at,
    ...rest
  } = obj as Record<string, unknown>;
  return rest as Omit<
    T,
    | "id"
    | "progress_kplt_id"
    | "final_status_it"
    | "tgl_selesai_izintetangga"
    | "created_at"
    | "updated_at"
  >;
}
