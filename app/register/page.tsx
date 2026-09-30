import Link from "next/link";
import { ArrowLeft, Box, ShieldCheck } from "lucide-react";

import RegisterForm from "@/components/login/register-form";

export default function RegisterPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-8">
      {/* Fondo decorativo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-20%] h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

        <div className="absolute bottom-[-20%] left-[-10%] h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* Contenedor */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl p-px">
        {/* Borde animado */}
        <div className="absolute inset-[-100%] animate-[spin_8s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0%,transparent_35%,hsl(var(--primary))_50%,transparent_65%,transparent_100%)]" />

        {/* Card */}
        <div className="relative rounded-3xl border bg-background/95 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          {/* Logo */}
          <div className="mb-7 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl" />

              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border bg-muted shadow-lg">
                <Box className="h-9 w-9 text-primary" strokeWidth={1.8} />
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Crear cuenta</h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Registra un nuevo usuario en{" "}
              <span className="font-medium text-foreground">LocalStock</span>
            </p>
          </div>

          {/* Formulario */}
          <RegisterForm />

          {/* Login */}
          <div className="mt-6 border-t pt-6">
            <p className="text-center text-sm text-muted-foreground">
              ¿Ya tienes una cuenta?
            </p>

            <Link
              href="/login"
              className="group mt-3 flex w-full items-center justify-center gap-2 rounded-xl border bg-muted/40 px-4 py-2.5 text-sm font-medium transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Iniciar sesión
            </Link>
          </div>

          {/* Seguridad */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />

            <span>Tus datos están protegidos</span>
          </div>
        </div>
      </div>
    </main>
  );
}
