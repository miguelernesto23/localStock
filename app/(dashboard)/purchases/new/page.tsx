import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CreatePurchaseForm } from "@/components/purchases/create-purchase-form";

export default function NewPurchasePage() {
  return (
    <div className="space-y-6 ">
      {/* Encabezado */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nueva compra</h1>

          <p className="text-muted-foreground">
            Registra los productos adquiridos y sus costos.
          </p>
        </div>

        <Button variant="outline" asChild>
          <Link href="/purchases">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
      </div>

      {/* Formulario */}
      <CreatePurchaseForm />
    </div>
  );
}
