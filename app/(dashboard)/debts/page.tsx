"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  Eye,
  Loader2,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { getDebts, payDebt } from "@/action/debt.action";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Debt = {
  id: number;
  personName: string;
  type: "CLIENT" | "SUPPLIER";
  total: number;
  remaining: number;
  status: "OPEN" | "PARTIAL" | "PAID";
  createdAt: Date | string;
  purchase?: {
    id: number;
    total: number;
    paymentType: string | null;
    supplierName: string | null;
    createdAt: Date | string;
  } | null;
  ticket?: {
    id: number;
    number: string;
    total: number;
    createdAt: Date | string;
  } | null;
};

function formatCurrency(value: number) {
  return `${value.toLocaleString("es-CU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} CUP`;
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("es-CU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getStatusLabel(status: Debt["status"]) {
  switch (status) {
    case "OPEN":
      return "Pendiente";

    case "PARTIAL":
      return "Pago parcial";

    case "PAID":
      return "Pagada";
  }
}

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);

  const [paymentAmount, setPaymentAmount] = useState("");

  const [paymentNotes, setPaymentNotes] = useState("");

  const [paying, setPaying] = useState(false);

  async function loadDebts() {
    setLoading(true);

    const result = await getDebts();

    if (result.success) {
      setDebts(result.debts as Debt[]);
    } else {
      toast.error(result.error);
    }

    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDebts();
  }, []);

  const filteredDebts = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return debts;
    }

    return debts.filter((debt) => {
      return (
        debt.personName.toLowerCase().includes(term) ||
        String(debt.id).includes(term) ||
        debt.type.toLowerCase().includes(term)
      );
    });
  }, [debts, search]);

  const supplierDebt = useMemo(() => {
    return debts
      .filter((debt) => debt.type === "SUPPLIER")
      .reduce((sum, debt) => sum + debt.remaining, 0);
  }, [debts]);

  const clientDebt = useMemo(() => {
    return debts
      .filter((debt) => debt.type === "CLIENT")
      .reduce((sum, debt) => sum + debt.remaining, 0);
  }, [debts]);

  const totalDebt = useMemo(() => {
    return debts.reduce((sum, debt) => sum + debt.total, 0);
  }, [debts]);

  const totalRemaining = useMemo(() => {
    return debts.reduce((sum, debt) => sum + debt.remaining, 0);
  }, [debts]);

  function openPaymentDialog(debt: Debt) {
    if (debt.status === "PAID") {
      return;
    }

    setSelectedDebt(debt);
    setPaymentAmount("");
    setPaymentNotes("");
  }

  function closePaymentDialog() {
    if (paying) return;

    setSelectedDebt(null);
    setPaymentAmount("");
    setPaymentNotes("");
  }

  async function handlePayment() {
    if (!selectedDebt) return;

    const amount = Number(paymentAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Introduce un monto válido.");
      return;
    }

    if (amount > selectedDebt.remaining) {
      toast.error("El monto supera el saldo pendiente.");
      return;
    }

    setPaying(true);

    const result = await payDebt({
      debtId: selectedDebt.id,
      amount,
      notes: paymentNotes.trim() || undefined,
    });

    if (!result.success) {
      toast.error(result.error);
      setPaying(false);
      return;
    }

    toast.success(
      selectedDebt.type === "SUPPLIER"
        ? "Pago al proveedor registrado."
        : "Cobro al cliente registrado.",
    );

    closePaymentDialog();

    await loadDebts();

    setPaying(false);
  }

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <CircleDollarSign className="h-4 w-4" />
            <span>Finanzas</span>
            <span>/</span>
            <span>Deudas</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight">Deudas</h1>

          <p className="text-muted-foreground">
            Controla las deudas con clientes y proveedores.
          </p>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Deuda a proveedores
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {formatCurrency(supplierDebt)}
                </p>
              </div>

              <ArrowDownCircle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Por cobrar</p>

                <p className="mt-1 text-2xl font-bold">
                  {formatCurrency(clientDebt)}
                </p>
              </div>

              <ArrowUpCircle className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total generado</p>

            <p className="mt-1 text-2xl font-bold">
              {formatCurrency(totalDebt)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Saldo pendiente</p>

            <p className="mt-1 text-2xl font-bold">
              {formatCurrency(totalRemaining)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Listado de deudas</CardTitle>

            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar deuda..."
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredDebts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CircleDollarSign className="mb-4 h-10 w-10 text-muted-foreground" />

              <p className="font-medium">No hay deudas</p>

              <p className="mt-1 text-sm text-muted-foreground">
                No se encontraron deudas con esos criterios.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/20 text-left">
                    <th className="px-6 py-3 font-medium">Persona</th>

                    <th className="px-6 py-3 font-medium">Tipo</th>

                    <th className="px-6 py-3 text-right font-medium">Total</th>

                    <th className="px-6 py-3 text-right font-medium">
                      Pendiente
                    </th>

                    <th className="px-6 py-3 font-medium">Estado</th>

                    <th className="px-6 py-3 font-medium">Origen</th>

                    <th className="px-6 py-3 font-medium">Fecha</th>

                    <th className="px-6 py-3 text-right font-medium">Acción</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredDebts.map((debt) => (
                    <tr
                      key={debt.id}
                      className="border-b last:border-0 hover:bg-muted/20"
                    >
                      <td className="px-6 py-4 font-medium">
                        {debt.personName}
                      </td>

                      <td className="px-6 py-4">
                        {debt.type === "SUPPLIER" ? (
                          <span className="inline-flex items-center gap-1.5 text-destructive">
                            <ArrowDownCircle className="h-4 w-4" />
                            Proveedor
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-primary">
                            <ArrowUpCircle className="h-4 w-4" />
                            Cliente
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        {formatCurrency(debt.total)}
                      </td>

                      <td className="px-6 py-4 text-right font-semibold">
                        {formatCurrency(debt.remaining)}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={
                            debt.status === "PAID"
                              ? "inline-flex items-center gap-1.5 text-green-600"
                              : debt.status === "PARTIAL"
                                ? "text-yellow-600"
                                : "text-orange-600"
                          }
                        >
                          {debt.status === "PAID" && (
                            <CheckCircle2 className="h-4 w-4" />
                          )}

                          {getStatusLabel(debt.status)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {debt.purchase ? (
                          <span>Compra #{debt.purchase.id}</span>
                        ) : debt.ticket ? (
                          <span>Ticket #{debt.ticket.number}</span>
                        ) : (
                          <span className="text-muted-foreground">Manual</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-muted-foreground">
                        {formatDate(debt.createdAt)}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Ver deuda"
                            asChild
                          >
                            <Link href={`/debts/${debt.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>

                          {debt.status !== "PAID" && (
                            <Button
                              size="sm"
                              onClick={() => openPaymentDialog(debt)}
                            >
                              <Banknote className="mr-2 h-4 w-4" />
                              {debt.type === "SUPPLIER" ? "Pagar" : "Cobrar"}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de pago */}
      <Dialog
        open={selectedDebt !== null}
        onOpenChange={(open) => {
          if (!open) {
            closePaymentDialog();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDebt?.type === "SUPPLIER"
                ? "Pagar deuda"
                : "Cobrar deuda"}
            </DialogTitle>

            <DialogDescription>
              {selectedDebt?.type === "SUPPLIER"
                ? "Registra el pago realizado al proveedor."
                : "Registra el dinero recibido del cliente."}
            </DialogDescription>
          </DialogHeader>

          {selectedDebt && (
            <div className="space-y-5">
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {selectedDebt.type === "SUPPLIER" ? "Proveedor" : "Cliente"}
                  </span>

                  <span className="font-medium">{selectedDebt.personName}</span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Pendiente
                  </span>

                  <span className="text-lg font-bold">
                    {formatCurrency(selectedDebt.remaining)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Monto</label>

                <Input
                  type="number"
                  min="0.01"
                  max={selectedDebt.remaining}
                  step="0.01"
                  value={paymentAmount}
                  onChange={(event) => setPaymentAmount(event.target.value)}
                  placeholder="0.00"
                  disabled={paying}
                />

                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() =>
                    setPaymentAmount(selectedDebt.remaining.toString())
                  }
                  disabled={paying}
                >
                  Pagar todo
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Nota</label>

                <Input
                  value={paymentNotes}
                  onChange={(event) => setPaymentNotes(event.target.value)}
                  placeholder="Ej. Pago parcial"
                  disabled={paying}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closePaymentDialog}
              disabled={paying}
            >
              Cancelar
            </Button>

            <Button
              type="button"
              onClick={handlePayment}
              disabled={paying || !paymentAmount || Number(paymentAmount) <= 0}
            >
              {paying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Banknote className="mr-2 h-4 w-4" />
                  Confirmar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
