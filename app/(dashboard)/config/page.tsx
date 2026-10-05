import { ArrowLeft, KeyRound, ShieldCheck } from "lucide-react";
import Link from "next/link";

import ChangePasswordForm from "@/components/settings/ChangePasswordForm";

export default function ConfiguracionPage() {
  return (
    <main className="container mx-auto max-w-5xl ">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Volver al dashboard
          </Link>
        </div>

        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
            <KeyRound className="size-6 text-primary" />
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>

            <p className="mt-1 text-muted-foreground">
              Gestiona la seguridad de tu cuenta de LocalStock.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Password */}
        <ChangePasswordForm />

        {/* Security information */}
        <aside className="h-fit rounded-xl border bg-card p-5 shadow-sm">
          <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-emerald-500/10">
            <ShieldCheck className="size-5 text-emerald-500" />
          </div>

          <h2 className="font-semibold">Seguridad de la cuenta</h2>

          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Mantén tu contraseña actualizada para proteger el acceso a tu
            información.
          </p>

          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <div className="size-2 rounded-full bg-emerald-500" />

              <span className="text-sm">Cuenta protegida</span>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <div className="size-2 rounded-full bg-primary" />

              <span className="text-sm">Contraseña cifrada</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
