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

// detail_progress enum normalizer: "belum"|"selesai"|"batal" -> "Belum"|"Selesai"|"Batal"
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

// Field editable perizinan (tanpa final_status_perizinan / tgl_selesai_perizinan)
export const PerizinanEditableSchema = z
  .object({
    file_sph: optionalNonEmptyString.optional(),
    tgl_sph: dateString.optional(),
    nominal_sph: optionalNumber.optional(),
    status_berkas: detailProgressEnum.optional(),
    tgl_st_berkas: dateString.optional(),
    file_bukti_st: optionalNonEmptyString.optional(),
    status_gambar_denah: detailProgressEnum.optional(),
    tgl_gambar_denah: dateString.optional(),
    file_denah: optionalNonEmptyString.optional(),
    oss: detailProgressEnum.optional(),
    tgl_oss: dateString.optional(),
    status_spk: detailProgressEnum.optional(),
    file_spk: optionalNonEmptyString.optional(),
    tgl_spk: dateString.optional(),
    rekom_notaris_vendor: detailProgressEnum.optional(),
    tgl_rekom_notaris: dateString.optional(),
    file_rekom_notaris: optionalNonEmptyString.optional(),
  })
  .strict();

export const PerizinanCreateSchema = PerizinanEditableSchema;
export const PerizinanUpdateSchema = PerizinanEditableSchema.partial().strict();

export const PerizinanApprovalSchema = z
  .object({
    final_status_perizinan: z
      .string()
      .transform((s) => s.trim().toLowerCase())
      .refine((s) => s === "selesai" || s === "batal", {
        message: "final_status_perizinan must be 'selesai' or 'batal'",
      }),
  })
  .strict();

export function stripServerControlledFieldsPerizinan<
  T extends Record<string, unknown>
>(obj: T) {
  const {
    id,
    progress_kplt_id,
    final_status_perizinan,
    tgl_selesai_perizinan,
    created_at,
    updated_at,
    ...rest
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = obj as any;
  return rest as Omit<
    T,
    | "id"
    | "progress_kplt_id"
    | "final_status_perizinan"
    | "tgl_selesai_perizinan"
    | "created_at"
    | "updated_at"
  >;
}
