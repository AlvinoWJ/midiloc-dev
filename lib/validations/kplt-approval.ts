import { z } from "zod";

export const KpltIdParamSchema = z.object({
  id: z.string(),
});

export const KpltApprovalPostSchema = z
  .object({
    is_approved: z.boolean(),
  })
  .strict();

export type KpltApprovalPostInput = z.infer<typeof KpltApprovalPostSchema>;

export const KpltStatusPatchSchema = z
  .object({
    kplt_approval: z.enum(["OK", "NOK"]),
  })
  .strict();

export type KpltStatusPatchInput = z.infer<typeof KpltStatusPatchSchema>;
