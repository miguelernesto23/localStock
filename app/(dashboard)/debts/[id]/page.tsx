"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownCircle,
  ArrowLeft,
  ArrowUpCircle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  Loader2,
  Receipt,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { getDebtById } from "@/action/debt.action";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DebtPayment = {
  id: number;
  amount: number;
  notes: string | null;
  createdAt: Date | string;
  cashBox: {
    id: number;
    name: string;
  };
};

type Debt = {
  id: number;
  personName: string;
  type: "CLIENT" | "SUPPLIER";
  total: number;
  remaining: number;
  status: "OPEN" | "PARTIAL" | "PAID";
  dueDate: Date | string | null;
  notes: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;

  purchase?: {
    id: number;
    total: number;
    paymentType: string | null;
    supplierName: string | null;
    notes: string | null;
    createdAt: Date | string;
    items: {
      id: number;
      quantity: number;
      unitCost: number;
      subtotal: number;
      productName: string | null;
      product: {
        id: number;
        name: string;
      } | null;
    }[];
  } | null;

  ticket?: {
    id: number;
    number: string;
    total: number;
    createdAt: Date | string;
  } | null;

  payments: DebtPayment[];
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatCurrency(value: number) {
  return `${value.toLocaleString("es-CU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} CUP`;
}

function formatDate(
  date: string | Date | null
) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("es-CU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(
  date: string | Date
) {
  return new Date(date).toLocaleString("es-CU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusLabel(
  status: Debt["status"]
) {
  switch (status) {
    case "OPEN":
      return "Pendiente";

    case "PARTIAL":
      return "Pago parcial";

    case "PAID":
      return "Pagada";
  }
}

export default function DebtDetailPage({
  params,
}: PageProps) {
  const [debt, setDebt] = useState<Debt | null>(
    null
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDebt() {
      try {
        const { id } = await params;

        const debtId = Number(id);

        if (
          !Number.isInteger(debtId) ||
          debtId <= 0
        ) {
          toast.error("La deuda no es válida.");
          return;
        }

        const result = await getDebtById(
          debtId
        );

        if (!result.success) {
          toast.error(result.error);
          return;
        }

        setDebt(result.debt as Debt);
      } catch (error) {
        console.error(
          "Error cargando detalle de deuda:",
          error
        );

        toast.error(
          "No se pudo cargar la deuda."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDebt();
  }, [params]);

  const totalPaid = useMemo(() => {
    if (!debt) return 0;

    return debt.payments.reduce(
      (sum, payment) =>
        sum + payment.amount,
      0
    );
  }, [debt]);

  const paymentPercentage = useMemo(() => {
    if (!debt || debt.total <= 0) {
      return 0;
    }

    return Math.min(
      100,
      (totalPaid / debt.total) * 100
    );
  }, [debt, totalPaid]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!debt) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CircleDollarSign className="mb-4 h-10 w-10 text-muted-foreground" />

            <h1 className="text-xl font-semibold">
              Deuda no encontrada
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              La deuda solicitada no existe o no
              tienes acceso a ella.
            </p>

            <Button
              asChild
              className="mt-6"
            >
              <Link href="/debts">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a deudas
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSupplier =
    debt.type === "SUPPLIER";

  const origin = debt.purchase
    ? `Compra #${debt.purchase.id}`
    : debt.ticket
      ? `Ticket #${debt.ticket.number}`
      : "Deuda manual";

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button
            asChild
            variant="ghost"
            className="-ml-3 mb-3"
          >
            <Link href="/debts">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a deudas
            </Link>
          </Button>

          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-lg ${
                isSupplier
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {isSupplier ? (
                <ArrowDownCircle className="h-6 w-6" />
              ) : (
                <ArrowUpCircle className="h-6 w-6" />
              )}
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Deuda #{debt.id}
              </h1>

              <p className="text-muted-foreground">
                {isSupplier
                  ? "Deuda con proveedor"
                  : "Deuda de cliente"}
              </p>
            </div>
          </div>
        </div>

        <div>
          {debt.status === "PAID" ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-2 text-sm font-medium text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              Pagada
            </div>
          ) : (
            <div className="rounded-full bg-orange-500/10 px-3 py-2 text-sm font-medium text-orange-600">
              {getStatusLabel(debt.status)}
            </div>
          )}
        </div>
      </div>

      {/* Resumen */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              Total de la deuda
            </p>

            <p className="mt-1 text-2xl font-bold">
              {formatCurrency(debt.total)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              Total pagado
            </p>

            <p className="mt-1 text-2xl font-bold text-green-600">
              {formatCurrency(totalPaid)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              Pendiente
            </p>

            <p className="mt-1 text-2xl font-bold">
              {formatCurrency(debt.remaining)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progreso */}
      <Card>
        <CardHeader>
          <CardTitle>Progreso de la deuda</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Pagado
            </span>

            <span className="font-semibold">
              {paymentPercentage.toFixed(0)}%
            </span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${paymentPercentage}%`,
              }}
            />
          </div>

          <div className="mt-3 flex justify-between text-xs text-muted-foreground">
            <span>
              {formatCurrency(totalPaid)}
            </span>

            <span>
              {formatCurrency(debt.total)}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Información */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Información</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="flex items-start gap-3">
              <User className="mt-0.5 h-5 w-5 text-muted-foreground" />

              <div>
                <p className="text-xs text-muted-foreground">
                  {isSupplier
                    ? "Proveedor"
                    : "Cliente"}
                </p>

                <p className="font-medium">
                  {debt.personName}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Receipt className="mt-0.5 h-5 w-5 text-muted-foreground" />

              <div>
                <p className="text-xs text-muted-foreground">
                  Origen
                </p>

                <p className="font-medium">
                  {origin}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 h-5 w-5 text-muted-foreground" />

              <div>
                <p className="text-xs text-muted-foreground">
                  Fecha de creación
                </p>

                <p className="font-medium">
                  {formatDate(debt.createdAt)}
                </p>
              </div>
            </div>

            {debt.dueDate && (
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 h-5 w-5 text-muted-foreground" />

                <div>
                  <p className="text-xs text-muted-foreground">
                    Fecha de vencimiento
                  </p>

                  <p className="font-medium">
                    {formatDate(debt.dueDate)}
                  </p>
                </div>
              </div>
            )}

            {debt.notes && (
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-5 w-5 text-muted-foreground" />

                <div>
                  <p className="text-xs text-muted-foreground">
                    Notas
                  </p>

                  <p className="text-sm">
                    {debt.notes}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Historial */}
        <Card className="overflow-hidden lg:col-span-2">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <CardTitle>
                Historial de pagos
              </CardTitle>

              <span className="text-sm text-muted-foreground">
                {debt.payments.length}{" "}
                {debt.payments.length === 1
                  ? "abono"
                  : "abonos"}
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {debt.payments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Banknote className="mb-4 h-10 w-10 text-muted-foreground" />

                <p className="font-medium">
                  No hay pagos registrados
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Esta deuda todavía no tiene abonos.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {debt.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Banknote className="h-4 w-4" />
                      </div>

                      <div>
                        <p className="font-medium">
                          {formatCurrency(
                            payment.amount
                          )}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(
                            payment.createdAt
                          )}
                        </p>

                        {payment.notes && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {payment.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-xs text-muted-foreground">
                        Caja
                      </p>

                      <p className="text-sm font-medium">
                        {payment.cashBox.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Compra relacionada */}
      {debt.purchase && (
        <Card>
          <CardHeader>
            <CardTitle>
              Compra relacionada
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  Compra
                </p>

                <p className="font-semibold">
                  #{debt.purchase.id}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Proveedor
                </p>

                <p className="font-semibold">
                  {debt.purchase.supplierName ||
                    debt.personName}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Total
                </p>

                <p className="font-semibold">
                  {formatCurrency(
                    debt.purchase.total
                  )}
                </p>
              </div>
            </div>

            {debt.purchase.items.length > 0 && (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30 text-left">
                      <th className="px-4 py-3 font-medium">
                        Producto
                      </th>

                      <th className="px-4 py-3 text-right font-medium">
                        Cantidad
                      </th>

                      <th className="px-4 py-3 text-right font-medium">
                        Costo
                      </th>

                      <th className="px-4 py-3 text-right font-medium">
                        Subtotal
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {debt.purchase.items.map(
                      (item) => (
                        <tr
                          key={item.id}
                          className="border-b last:border-0"
                        >
                          <td className="px-4 py-3">
                            {item.productName ||
                              item.product?.name ||
                              "Producto eliminado"}
                          </td>

                          <td className="px-4 py-3 text-right">
                            {item.quantity}
                          </td>

                          <td className="px-4 py-3 text-right">
                            {formatCurrency(
                              item.unitCost
                            )}
                          </td>

                          <td className="px-4 py-3 text-right font-medium">
                            {formatCurrency(
                              item.subtotal
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Ticket relacionado */}
      {debt.ticket && (
        <Card>
          <CardHeader>
            <CardTitle>
              Venta relacionada
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  Ticket
                </p>

                <p className="font-semibold">
                  #{debt.ticket.number}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Total
                </p>

                <p className="font-semibold">
                  {formatCurrency(
                    debt.ticket.total
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Fecha
                </p>

                <p className="font-semibold">
                  {formatDate(
                    debt.ticket.createdAt
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}