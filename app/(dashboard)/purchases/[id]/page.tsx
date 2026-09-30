"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  Loader2,
  Package,
  Receipt,
  Store,
  User,
} from "lucide-react";

import { getPurchaseById } from "@/action/purchase.action";

import { Button } from "@/components/ui/button";

type PurchaseItem = {
  id: number;
  quantity: number;
  unitCost: number;
  subtotal: number;
  productName: string | null;
  productId: number | null;
  product: {
    id: number;
    name: string;
    barcode: string | null;
    unit: string;
  } | null;
};

type Purchase = {
  id: number;
  total: number;
  paymentType: string | null;
  supplierName: string | null;
  notes: string | null;
  createdAt: Date;
  items: PurchaseItem[];
  user: {
    id: number;
    name: string;
    user_name: string;
  };
};

export default function PurchaseDetailPage() {
  const params = useParams();
  const id = Number(params.id);

  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadPurchase() {
    try {
      setLoading(true);
      setError("");

      if (!Number.isInteger(id) || id <= 0) {
        setError("El identificador de la compra no es válido.");
        return;
      }

      const result = await getPurchaseById(id);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setPurchase(result.purchase as Purchase);
    } catch (error) {
      console.error("Error cargando compra:", error);
      setError("No se pudo cargar la compra.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPurchase();
  }, [id]);
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CU", {
      style: "currency",
      currency: "CUP",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-CU", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date(date));
  };

  const getPaymentLabel = (paymentType: string | null) => {
    switch (paymentType) {
      case "EFECTIVO":
        return "Efectivo";

      case "TRANSFERENCIA":
        return "Transferencia";

      case "CREDITO":
        return "Crédito";

      default:
        return "No especificado";
    }
  };

  const getPaymentClassName = (paymentType: string | null) => {
    switch (paymentType) {
      case "EFECTIVO":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";

      case "TRANSFERENCIA":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";

      case "CREDITO":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";

      default:
        return "bg-muted text-muted-foreground";
    }
  };

  // ==============================
  // Loading
  // ==============================

  if (loading) {
    return (
      <div className="flex min-h-125 items-center justify-center p-2">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />

          <div>
            <p className="font-medium">Cargando compra...</p>

            <p className="text-sm text-muted-foreground">
              Estamos obteniendo los detalles.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==============================
  // Error
  // ==============================

  if (error || !purchase) {
    return (
      <div className="flex min-h-[500px] items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <Receipt className="h-6 w-6 text-destructive" />
          </div>

          <h1 className="text-lg font-semibold">No se pudo cargar la compra</h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {error || "La compra no existe."}
          </p>

          <div className="mt-6 flex justify-center gap-2">
            <Button variant="outline" onClick={loadPurchase}>
              Intentar nuevamente
            </Button>

            <Button asChild>
              <Link href="/purchases">Volver a compras</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* ============================== */}
      {/* Header */}
      {/* ============================== */}

      <div className="flex flex-col gap-4">
        <Button variant="ghost" asChild className="w-fit px-2">
          <Link href="/purchases">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a compras
          </Link>
        </Button>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                <Receipt className="h-5 w-5 text-primary" />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Detalle de compra
                </p>

                <h1 className="text-2xl font-bold tracking-tight">
                  Compra #{purchase.id}
                </h1>
              </div>
            </div>
          </div>

          <span
            className={`inline-flex w-fit rounded-full px-3 py-1.5 text-sm font-medium ${getPaymentClassName(
              purchase.paymentType,
            )}`}
          >
            {getPaymentLabel(purchase.paymentType)}
          </span>
        </div>
      </div>

      {/* ============================== */}
      {/* Información general */}
      {/* ============================== */}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <Store className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Proveedor</p>

              <p className="truncate font-medium">
                {purchase.supplierName || "Sin proveedor"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Fecha</p>

              <p className="truncate font-medium">
                {formatDate(purchase.createdAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Productos</p>

              <p className="font-medium">
                {purchase.items.length}{" "}
                {purchase.items.length === 1 ? "producto" : "productos"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Registrado por</p>

              <p className="truncate font-medium">{purchase.user.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================== */}
      {/* Productos */}
      {/* ============================== */}

      <div className="rounded-xl border bg-card shadow-sm">
        <div className="border-b p-5">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-primary" />

            <div>
              <h2 className="font-semibold">Productos de la compra</h2>

              <p className="text-sm text-muted-foreground">
                Detalle de los productos adquiridos
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Producto</th>

                <th className="px-5 py-3 text-center font-medium">Cantidad</th>

                <th className="px-5 py-3 text-right font-medium">
                  Costo unitario
                </th>

                <th className="px-5 py-3 text-right font-medium">Subtotal</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {purchase.items.map((item) => (
                <tr
                  key={item.id}
                  className="transition-colors hover:bg-muted/30"
                >
                  <td className="px-5 py-4">
                    <div className="font-medium">
                      {item.productName ||
                        item.product?.name ||
                        "Producto eliminado"}
                    </div>

                    {item.product?.barcode && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Código: {item.product.barcode}
                      </div>
                    )}
                  </td>

                  <td className="px-5 py-4 text-center">
                    <span className="font-medium">{item.quantity}</span>

                    {item.product?.unit && (
                      <span className="ml-1 text-muted-foreground">
                        {item.product.unit}
                      </span>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-right">
                    {formatCurrency(item.unitCost)}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-right font-medium">
                    {formatCurrency(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div className="border-t bg-muted/30 p-5">
          <div className="flex items-center justify-between">
            <span className="text-base font-medium">Total de la compra</span>

            <span className="text-2xl font-bold">
              {formatCurrency(purchase.total)}
            </span>
          </div>
        </div>
      </div>

      {/* ============================== */}
      {/* Notas */}
      {/* ============================== */}

      {purchase.notes && (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="mb-2 font-semibold">Notas</h2>

          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {purchase.notes}
          </p>
        </div>
      )}

      {/* ============================== */}
      {/* Resumen */}
      {/* ============================== */}

      <div className="flex justify-end">
        <div className="w-full rounded-xl border bg-card p-5 shadow-sm sm:max-w-sm">
          <div className="mb-3 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />

            <span className="text-sm font-medium">Resumen de pago</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Forma de pago</span>

            <span className="font-medium">
              {getPaymentLabel(purchase.paymentType)}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between border-t pt-3">
            <span className="font-semibold">Total</span>

            <span className="text-xl font-bold">
              {formatCurrency(purchase.total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
