"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import { toast } from "sonner";

import { changePassword } from "@/action/user.action";
import {
  passwordSchema,
  type PasswordFormData,
} from "@/schema/password.schema";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ChangePasswordForm() {
  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: PasswordFormData) {
    const result = await changePassword(data);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);

    reset();
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <LockKeyhole className="size-5 text-primary" />
          </div>

          <div>
            <CardTitle>Cambiar contraseña</CardTitle>

            <CardDescription>
              Actualiza la contraseña de tu cuenta.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
        >
          {/* Contraseña actual */}
          <div className="space-y-2">
            <label
              htmlFor="currentPassword"
              className="text-sm font-medium"
            >
              Contraseña actual
            </label>

            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                placeholder="Introduce tu contraseña actual"
                disabled={isSubmitting}
                {...register("currentPassword")}
                className="pr-10"
              />

              <button
                type="button"
                onClick={() =>
                  setShowCurrentPassword((value) => !value)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showCurrentPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>

            {errors.currentPassword && (
              <p className="text-sm text-destructive">
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          {/* Nueva contraseña */}
          <div className="space-y-2">
            <label
              htmlFor="newPassword"
              className="text-sm font-medium"
            >
              Nueva contraseña
            </label>

            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                placeholder="Introduce tu nueva contraseña"
                disabled={isSubmitting}
                {...register("newPassword")}
                className="pr-10"
              />

              <button
                type="button"
                onClick={() =>
                  setShowNewPassword((value) => !value)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showNewPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>

            {errors.newPassword && (
              <p className="text-sm text-destructive">
                {errors.newPassword.message}
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              La contraseña debe tener al menos 8 caracteres.
            </p>
          </div>

          {/* Confirmar contraseña */}
          <div className="space-y-2">
            <label
              htmlFor="confirmPassword"
              className="text-sm font-medium"
            >
              Confirmar nueva contraseña
            </label>

            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Repite tu nueva contraseña"
                disabled={isSubmitting}
                {...register("confirmPassword")}
                className="pr-10"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword((value) => !value)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>

            {errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                "Cambiar contraseña"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}