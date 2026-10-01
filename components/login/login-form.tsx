"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/schema/login.schema";
import { LoginAction } from "@/action/auth/login.action";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function LoginForm() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      user_name: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormData) {
    setIsLoading(true);
    setError("");

    const formData = new FormData();

    formData.append("user_name", data.user_name);
    formData.append("password", data.password);

    const result = await LoginAction(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        ease: "easeOut",
      }}
    >
      {/* Usuario */}
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          duration: 0.4,
          delay: 0.1,
        }}
      >
        <label htmlFor="user_name" className="text-sm font-medium">
          Usuario
        </label>

        <Input
          id="user_name"
          type="text"
          placeholder="Ingresa tu usuario"
          autoComplete="username"
          disabled={isLoading}
          aria-invalid={!!errors.user_name}
          aria-describedby={errors.user_name ? "user_name-error" : undefined}
          {...register("user_name", {
            onChange: () => {
              if (error) setError("");
            },
          })}
        />

        <AnimatePresence mode="wait">
          {errors.user_name && (
            <motion.p
              id="user_name-error"
              className="text-sm text-red-500"
              initial={{ opacity: 0, height: 0, y: -5 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              {errors.user_name.message}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Contraseña */}
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          duration: 0.4,
          delay: 0.2,
        }}
      >
        <label htmlFor="password" className="text-sm font-medium">
          Contraseña
        </label>

        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Ingresa tu contraseña"
            autoComplete="current-password"
            disabled={isLoading}
            className="pr-10"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password", {
              onChange: () => {
                if (error) setError("");
              },
            })}
          />

          <motion.button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            disabled={isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={
              showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
            }
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </motion.button>
        </div>

        <AnimatePresence mode="wait">
          {errors.password && (
            <motion.p
              id="password-error"
              className="text-sm text-red-500"
              initial={{ opacity: 0, height: 0, y: -5 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              {errors.password.message}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Error del servidor */}
      <AnimatePresence>
        {error && (
          <motion.div
            role="alert"
            className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-500"
            initial={{
              opacity: 0,
              y: -10,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -10,
              scale: 0.98,
            }}
            transition={{
              duration: 0.25,
            }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          delay: 0.3,
        }}
      >
        <motion.div
          whileHover={{ scale: isLoading ? 1 : 1.02 }}
          whileTap={{ scale: isLoading ? 1 : 0.98 }}
        >
          <Button type="submit" className="w-full" disabled={isLoading}>
            <AnimatePresence mode="wait" initial={false}>
              {isLoading ? (
                <motion.span
                  key="loading"
                  className="flex items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </motion.span>
              ) : (
                <motion.span
                  key="login"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Iniciar sesión
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>
      </motion.div>
    </motion.form>
  );
}
