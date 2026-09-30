import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),

    user_name: z.string().min(3, "El usuario debe tener al menos 3 caracteres"),

    password: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres"),

    confirmPassword: z.string().min(6, "Debes confirmar la contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
