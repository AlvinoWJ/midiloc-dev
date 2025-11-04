/* eslint-disable @typescript-eslint/no-unused-vars */
import { z } from "zod";

const emptyToUndefined = (v: unknown) =>
  v === "" || v === null ? undefined : v;
const dateString = z.preprocess(
  emptyToUndefined,
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
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

export const GOEditableSchema = z
  .object({
    rekom_go_vendor: detailProgressEnum.optional(),
    tgl_rekom_go_vendor: dateString.optional(),
    tgl_go: dateString.optional(),
  })
  .strict();

export const GOCreateSchema = GOEditableSchema;
export const GOUpdateSchema = GOEditableSchema.partial().strict();

export const GOApprovalSchema = z
  .object({
    final_status_go: z
      .string()
      .transform((s) => s.trim().toLowerCase())
      .refine((s) => s === "selesai" || s === "batal", {
        message: "final_status_go must be 'selesai' or 'batal'",
      }),
  })
  .strict();

export function stripServerControlledFieldsGO<
  T extends Record<string, unknown>
>(obj: T) {
  const {
    id,
    progress_kplt_id,
    final_status_go,
    tgl_selesai_go,
    created_at,
    updated_at,
    ...rest
  } = obj as T;
  return rest as Omit<
    T,
    | "id"
    | "progress_kplt_id"
    | "final_status_go"
    | "tgl_selesai_go"
    | "created_at"
    | "updated_at"
  >;
}
