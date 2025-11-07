import { z } from "zod";

export const assignBranchSchema = z.object({
  branch_id: z.string().uuid("branch_id harus UUID"),
});

export type AssignBranchInput = z.infer<typeof assignBranchSchema>;

export const assignPICSchema = z.object({
  penanggungjawab: z.string().uuid("penanggungjawab harus UUID"),
  description: z.string().max(5000, "description terlalu panjang").optional(),
});

export type AssignPICInput = z.infer<typeof assignPICSchema>;

export const approveSchema = z.object({
  status_ulok_eksternal: z.enum(["OK", "NOK"], {
    error: "status wajib atau tidak valid",
  }),
});

export type ApproveInput = z.infer<typeof approveSchema>;
