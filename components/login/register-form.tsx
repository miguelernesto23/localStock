"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Loader2 } from "lucide-react";

import {
  registerSchema,
  type RegisterFormData,
} from "@/schema/register.schema";

import { RegistreAction } from "@/action/auth/registre.action";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterForm() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [animation, setAnimation] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      user_name: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: RegisterFormData) {
    setMessage("");
    setError("");
    setAnimation(true);

    try {
      const formData = new FormData();

      formData.append("name", data.name);
      formData.append("user_name", data.user_name);
      formData.append("password", data.password);
      formData.append("confirmPassword", data.confirmPassword);

      const result = await RegistreAction(formData);

      if (result.error) {
        setError(result.error);
        return;
      }
    } finally {
      setAnimation(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Campos del formulario */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Nombre */}
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Nombre
          </label>

          <Input
            id="name"
            type="text"
            placeholder="Ingresa tu nombre"
            {...register("name")}
          />

          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        {/* Usuario */}
        <div className="space-y-2">
          <label htmlFor="user_name" className="text-sm font-medium">
            Usuario
          </label>

          <Input
            id="user_name"
            type="text"
            placeholder="Ingresa tu usuario"
            {...register("user_name")}
          />

          {errors.user_name && (
            <p className="text-sm text-destructive">
              {errors.user_name.message}
            </p>
          )}
        </div>

        {/* Contraseña */}
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Contraseña
          </label>

          <Input
            id="password"
            type="password"
            placeholder="Ingresa tu contraseña"
            {...register("password")}
          />

          {errors.password && (
            <p className="text-sm text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirmar contraseña */}
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirmar contraseña
          </label>

          <Input
            id="confirmPassword"
            type="password"
            placeholder="Repite tu contraseña"
            {...register("confirmPassword")}
          />

          {errors.confirmPassword && (
            <p className="text-sm text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Mensaje de éxito */}
      {message && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3">
          <p className="text-sm text-green-600 dark:text-green-400">
            {message}
          </p>
        </div>
      )}

      {/* Botón */}
      <Button type="submit" className="w-full" disabled={animation}>
        {animation ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creando cuenta...
          </>
        ) : (
          "Crear cuenta"
        )}
      </Button>
    </form>
  );
}
