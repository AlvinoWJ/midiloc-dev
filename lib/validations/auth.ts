import { z } from "zod";

export const signUpSchema = z.object({
  email: z.string().email("Format email tidak valid"),
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
    
  branch_id: z.string().min(1, "Branch harus dipilih"),
  position_id: z.string().min(1, "Position harus dipilih"),
  role_id: z.string().min(1, "Role harus dipilih"),
});

export type SignUpFormData = z.infer<typeof signUpSchema>;