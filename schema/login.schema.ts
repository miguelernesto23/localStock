import { z } from "zod";

export const loginSchema = z.object({
  user_name: z
    .string()
    .min(3, "El usuario debe tener al menos 3 caracteres"),

  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export type LoginFormData = z.infer<typeof loginSchema>;