/* eslint-disable @typescript-eslint/no-explicit-any */
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

export const RenovasiEditableSchema = z
  .object({
    kode_store: optionalNonEmptyString.optional(),
    tipe_toko: optionalNonEmptyString.optional(),
    bentuk_objek: optionalNonEmptyString.optional(), // will be cast to enum in RPC
    rekom_renovasi: detailProgressEnum.optional(),
    tgl_rekom_renovasi: dateString.optional(),
    file_rekom_renovasi: optionalNonEmptyString.optional(),
    start_spk_renov: dateString.optional(),
    end_spk_renov: dateString.optional(),
    plan_renov: optionalNumber.optional(),
    proses_renov: optionalNumber.optional(),
    deviasi: optionalNumber.optional(),
    tgl_serah_terima: dateString.optional(),
  })
  .strict();

export const RenovasiCreateSchema = RenovasiEditableSchema;
export const RenovasiUpdateSchema = RenovasiEditableSchema.partial().strict();

export const RenovasiApprovalSchema = z
  .object({
    final_status_renov: z
      .string()
      .transform((s) => s.trim().toLowerCase())
      .refine((s) => s === "selesai" || s === "batal", {
        message: "final_status_renov must be 'selesai' or 'batal'",
      }),
  })
  .strict();

export function stripServerControlledFieldsRenovasi<
  T extends Record<string, unknown>
>(obj: T) {
  const {
    id,
    progress_kplt_id,
    final_status_renov,
    tgl_selesai_renov,
    created_at,
    updated_at,
    ...rest
  } = obj as any;
  return rest as Omit<
    T,
    | "id"
    | "progress_kplt_id"
    | "final_status_renov"
    | "tgl_selesai_renov"
    | "created_at"
    | "updated_at"
  >;
}
