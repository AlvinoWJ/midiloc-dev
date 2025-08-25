import { z } from "zod";

export const signUpSchema = z.object({
  email: z
    .email("Format email tidak valid")
    .min(1, "Email wajib diisi"),
  password: z
    .string()
    .min(6, "Password minimal 6 karakter")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password harus mengandung huruf besar, huruf kecil, dan angka"
    ),
  nama: z
    .string()
    .min(2, "Nama minimal 2 karakter")
    .max(255, "Nama maksimal 255 karakter"),
  branch_id: z
    .uuid("Branch harus dipilih")
    .min(1, "Branch wajib dipilih"),
  position_id: z
    .uuid("Position harus dipilih")
    .min(1, "Position wajib dipilih"),
  role_id: z.uuid("Role harus dipilih").min(1, "Role wajib dipilih"),
});

export type SignUpFormData = z.infer<typeof signUpSchema>;
