"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Loader2,
  Minus,
  Plus,
  WalletCards,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  getCashBoxes,
  createCashBox,
  getCashMovements,
  addCapital,
  removeCapital,
} from "@/action/cashbox.action";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type CashBox = {
  id: number;
  name: string;
  initialCapital: number;
  currentBalance: number;
  currency: string;
  active: boolean;
};

type CashMovement = {
  id: number;
  type: string;
  amount: number;
  description: string | null;
  createdAt: Date;
};

export default function CapitalPage() {
  const [cashBoxes, setCashBoxes] = useState<CashBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBoxId, setSelectedBoxId] = useState<number | null>(null);

  // Crear caja
  const [name, setName] = useState("");
  const [initialCapital, setInitialCapital] = useState("");
  const [creating, setCreating] = useState(false);

  // Ingresar/retirar capital
  const [capitalDialogOpen, setCapitalDialogOpen] = useState(false);
  const [selectedCashBox, setSelectedCashBox] = useState<CashBox | null>(null);
  const [capitalAmount, setCapitalAmount] = useState("");
  const [capitalMode, setCapitalMode] = useState<"IN" | "OUT">("IN");
  const [processingCapital, setProcessingCapital] = useState(false);

  // Mensajes
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Movimientos
  const [movements, setMovements] = useState<CashMovement[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const result = await getCashBoxes();

        if (cancelled) return;

        if (!result.success) {
          setError(result.error);
          return;
        }

        setCashBoxes(result.cashBoxes);

        if (result.cashBoxes.length > 0) {
          const nextSelectedBoxId: number = result.cashBoxes[0].id;
          setSelectedBoxId(nextSelectedBoxId);

          const movementsResult = await getCashMovements(nextSelectedBoxId);

          if (cancelled) return;

          if (!movementsResult.success) {
            setError(movementsResult.error);
            return;
          }

          setMovements(movementsResult.movements);
        } else {
          setSelectedBoxId(null);
          setMovements([]);
        }
      } catch (error) {
        if (cancelled) return;

        console.error("Error obteniendo cajas:", error);
        setError("No se pudieron cargar las cajas.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  async function loadCashBoxes() {
    try {
      setLoading(true);
      setError("");

      const result = await getCashBoxes();

      if (!result.success) {
        setError(result.error);
        return;
      }

      setCashBoxes(result.cashBoxes);

      if (result.cashBoxes.length > 0) {
        const selectedMatch =
          selectedBoxId !== null
            ? result.cashBoxes.find((cashBox) => cashBox.id === selectedBoxId)
            : undefined;

        const nextSelectedBoxId: number =
          selectedMatch?.id ?? result.cashBoxes[0].id;

        setSelectedBoxId(nextSelectedBoxId);
        await loadMovementsForCashBox(nextSelectedBoxId);
      } else {
        setSelectedBoxId(null);
        setMovements([]);
      }
    } catch (error) {
      console.error("Error obteniendo cajas:", error);
      setError("No se pudieron cargar las cajas.");
    } finally {
      setLoading(false);
    }
  }

  async function loadMovementsForCashBox(cashBoxId: number) {
    const movementsResult = await getCashMovements(cashBoxId);

    if (!movementsResult.success) {
      setError(movementsResult.error);
      return;
    }

    setMovements(movementsResult.movements);
  }

  useEffect(() => {
    if (selectedBoxId === null) return;

    const boxId = selectedBoxId;

    async function refreshMovements() {
      try {
        await loadMovementsForCashBox(boxId);
      } catch (error) {
        console.error("Error actualizando movimientos:", error);
      }
    }

    refreshMovements();
  }, [selectedBoxId]);

  async function handleCreateCashBox(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const capital = Number(initialCapital);

    if (!name.trim()) {
      setError("El nombre de la caja es obligatorio.");
      toast.error("El nombre de la caja es obligatorio", {
        position: "top-center",
      });
      return;
    }

    if (!Number.isFinite(capital) || capital < 0) {
      setError("Introduce un capital inicial válido.");
      toast.error("Introduce un capital inicial válido", {
        position: "top-center",
      });
      return;
    }

    setCreating(true);

    try {
      const result = await createCashBox({
        name,
        initialCapital: capital,
      });

      if (!result.success) {
        setError(result.error);
        toast.error(result.error, {
          position: "top-center",
        });
        return;
      }

      setSuccess("Caja creada correctamente.");
      toast.success("Caja creada correctamente", {
        position: "top-center",
      });

      setName("");
      setInitialCapital("");

      await loadCashBoxes();
    } catch (error) {
      console.error("Error creando caja:", error);
      setError("No se pudo crear la caja.");
      toast.error("No se pudo crear la caja", {
        position: "top-center",
      });
    } finally {
      setCreating(false);
    }
  }

  async function handleAdjustCapital(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!selectedCashBox) {
      setError("No hay una caja seleccionada.");
      toast.error("No hay una caja seleccionada", {
        position: "top-center",
      });
      return;
    }

    const amount = Number(capitalAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Introduce un monto válido mayor que 0.");
      toast.error("Introduce un monto válido mayor que 0", {
        position: "top-center",
      });
      return;
    }

    if (capitalMode === "OUT" && amount > selectedCashBox.currentBalance) {
      setError("No hay suficiente saldo para retirar ese monto.");
      toast.error("No hay suficiente saldo para retirar ese monto", {
        position: "top-center",
      });
      return;
    }

    setProcessingCapital(true);

    try {
      const result =
        capitalMode === "IN"
          ? await addCapital({
              cashBoxId: selectedCashBox.id,
              amount,
            })
          : await removeCapital({
              cashBoxId: selectedCashBox.id,
              amount,
            });

      if (!result.success) {
        setError(result.error);
        toast.error(result.error, {
          position: "top-center",
        });
        return;
      }

      setCapitalAmount("");
      setCapitalDialogOpen(false);
      setSelectedCashBox(null);
      setCapitalMode("IN");

      setSuccess(
        capitalMode === "IN"
          ? "Capital ingresado correctamente."
          : "Capital retirado correctamente.",
      );

      toast.success(
        capitalMode === "IN"
          ? "Capital ingresado correctamente"
          : "Capital retirado correctamente",
        {
          position: "top-center",
        },
      );

      await loadCashBoxes();
    } catch (error) {
      console.error(
        capitalMode === "IN"
          ? "Error ingresando capital:"
          : "Error retirando capital:",
        error,
      );

      setError(
        capitalMode === "IN"
          ? "No se pudo ingresar el capital."
          : "No se pudo retirar el capital.",
      );

      toast.error(
        capitalMode === "IN"
          ? "No se pudo ingresar el capital"
          : "No se pudo retirar el capital",
        {
          position: "top-center",
        },
      );
    } finally {
      setProcessingCapital(false);
    }
  }

  function handleOpenCapitalDialog(cashBox: CashBox, mode: "IN" | "OUT") {
    setSelectedCashBox(cashBox);
    setCapitalMode(mode);
    setCapitalAmount("");
    setError("");
    setSuccess("");
    setCapitalDialogOpen(true);
  }

  function handleCloseCapitalDialog() {
    if (processingCapital) return;

    setCapitalDialogOpen(false);
    setSelectedCashBox(null);
    setCapitalAmount("");
    setCapitalMode("IN");
  }

  function formatCurrency(value: number, currency = "CUP") {
    return `${value.toLocaleString("es-CU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${currency}`;
  }

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat("es-CU", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  }

  function getMovementLabel(type: string) {
    switch (type) {
      case "IN":
        return "Entrada";

      case "OUT":
        return "Salida";

      case "CAPITAL":
        return "Capital";

      case "SALE":
        return "Venta";

      case "PURCHASE":
        return "Compra";

      case "INCOME":
        return "Ingreso";

      case "EXPENSE":
        return "Egreso";

      case "ADJUSTMENT":
        return "Ajuste";

      default:
        return type;
    }
  }

  function getMovementClassName(type: string) {
    switch (type) {
      case "IN":
      case "CAPITAL":
      case "INCOME":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";

      case "OUT":
      case "PURCHASE":
      case "EXPENSE":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";

      case "SALE":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";

      case "ADJUSTMENT":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";

      default:
        return "bg-muted text-muted-foreground";
    }
  }

  function isIncomeMovement(type: string) {
    return ["IN", "CAPITAL", "SALE", "INCOME"].includes(type);
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.45,
          ease: "easeOut",
        }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <div className="flex items-center gap-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.35,
                delay: 0.1,
              }}
            >
              <WalletCards className="h-6 w-6 text-primary" />
            </motion.div>

            <h1 className="text-2xl font-bold tracking-tight">Capital</h1>
          </div>

          <p className="mt-1 text-muted-foreground">
            Administra tus cajas y el capital disponible.
          </p>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {error && !capitalDialogOpen && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </motion.div>
        )}

        {success && !capitalDialogOpen && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3 text-sm text-green-600 dark:text-green-400"
          >
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.45,
          delay: 0.08,
          ease: "easeOut",
        }}
        className="rounded-xl border bg-card p-6 shadow-sm"
      >
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Crear caja</h2>
          <p className="text-sm text-muted-foreground">
            Define el capital inicial disponible.
          </p>
        </div>

        <form
          onSubmit={handleCreateCashBox}
          className="grid gap-4 md:grid-cols-3"
        >
          <div className="space-y-2">
            <label htmlFor="cashbox-name" className="text-sm font-medium">
              Nombre
            </label>

            <Input
              id="cashbox-name"
              placeholder="Ej. Caja principal"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={creating}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="initial-capital" className="text-sm font-medium">
              Capital inicial
            </label>

            <Input
              id="initial-capital"
              type="number"
              min="0"
              step="0.01"
              placeholder="Ej. 10000"
              value={initialCapital}
              onChange={(event) => setInitialCapital(event.target.value)}
              disabled={creating}
            />
          </div>

          <div className="flex items-end">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full"
            >
              <Button type="submit" disabled={creating} className="w-full">
                {creating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}

                {creating ? "Creando..." : "Crear caja"}
              </Button>
            </motion.div>
          </div>
        </form>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.45,
          delay: 0.15,
          ease: "easeOut",
        }}
        className="space-y-4"
      >
        <div>
          <h2 className="text-lg font-semibold">Mis cajas</h2>
          <p className="text-sm text-muted-foreground">
            Cajas disponibles y su saldo actual.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex min-h-45 items-center justify-center rounded-xl border bg-card"
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando cajas...
              </div>
            </motion.div>
          ) : cashBoxes.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.3 }}
              className="rounded-xl border border-dashed p-8 text-center"
            >
              <WalletCards className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />

              <p className="font-medium">No tienes cajas creadas</p>

              <p className="mt-1 text-sm text-muted-foreground">
                Crea tu primera caja para comenzar a administrar el capital.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="boxes"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              {cashBoxes.map((cashBox, index) => (
                <motion.div
                  key={cashBox.id}
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.35,
                    delay: index * 0.07,
                    ease: "easeOut",
                  }}
                  whileHover={{
                    y: -3,
                    transition: {
                      duration: 0.2,
                    },
                  }}
                  className="rounded-xl border bg-card p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <WalletCards className="h-4 w-4 text-primary" />
                      </div>

                      <h3 className="font-semibold">{cashBox.name}</h3>
                    </div>

                    <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                      {cashBox.currency}
                    </span>
                  </div>

                  <div className="mt-5">
                    <p className="text-sm text-muted-foreground">
                      Saldo actual
                    </p>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        delay: index * 0.07 + 0.15,
                      }}
                      className="mt-1 text-3xl font-bold tracking-tight"
                    >
                      {formatCurrency(cashBox.currentBalance, cashBox.currency)}
                    </motion.p>
                  </div>

                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleOpenCapitalDialog(cashBox, "IN")}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Ingresar
                      </Button>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleOpenCapitalDialog(cashBox, "OUT")}
                      >
                        <Minus className="mr-2 h-4 w-4" />
                        Retirar
                      </Button>
                    </motion.div>
                  </div>

                  <div className="mt-4 border-t pt-4">
                    <p className="text-xs text-muted-foreground">
                      Capital inicial
                    </p>

                    <p className="font-medium">
                      {formatCurrency(cashBox.initialCapital, cashBox.currency)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <Dialog
        open={capitalDialogOpen}
        onOpenChange={(open) => {
          if (open) {
            setCapitalDialogOpen(true);
          } else {
            handleCloseCapitalDialog();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {capitalMode === "IN" ? "Ingresar capital" : "Retirar capital"}
            </DialogTitle>

            <DialogDescription>
              {selectedCashBox
                ? `${capitalMode === "IN" ? "Agrega" : "Retira"} dinero de ${selectedCashBox.name}.`
                : "Seleccione una caja."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAdjustCapital} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="capital-amount" className="text-sm font-medium">
                Monto
              </label>

              <Input
                id="capital-amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Ej. 5000"
                value={capitalAmount}
                onChange={(event) => setCapitalAmount(event.target.value)}
                autoFocus
                disabled={processingCapital}
              />

              {selectedCashBox && (
                <p className="text-xs text-muted-foreground">
                  Saldo actual:{" "}
                  {formatCurrency(
                    selectedCashBox.currentBalance,
                    selectedCashBox.currency,
                  )}
                </p>
              )}
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-sm text-destructive"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <DialogFooter>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="button"
                  variant="outline"
                  disabled={processingCapital}
                  onClick={handleCloseCapitalDialog}
                >
                  Cancelar
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button type="submit" disabled={processingCapital}>
                  {processingCapital ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : capitalMode === "IN" ? (
                    <Plus className="mr-2 h-4 w-4" />
                  ) : (
                    <Minus className="mr-2 h-4 w-4" />
                  )}

                  {processingCapital
                    ? capitalMode === "IN"
                      ? "Ingresando..."
                      : "Retirando..."
                    : capitalMode === "IN"
                      ? "Confirmar ingreso"
                      : "Confirmar retiro"}
                </Button>
              </motion.div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {cashBoxes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.45,
            delay: 0.2,
            ease: "easeOut",
          }}
          className="space-y-4"
        >
          <div>
            <h2 className="text-lg font-semibold">Historial de movimientos</h2>
            <p className="text-sm text-muted-foreground">
              Movimientos registrados en la caja.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <AnimatePresence mode="wait">
              {movements.length === 0 ? (
                <motion.div
                  key="empty-movements"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="p-8 text-center"
                >
                  <CalendarDays className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />

                  <p className="font-medium">No hay movimientos</p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Los movimientos de esta caja aparecerán aquí.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="movements"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="max-h-[60vh] overflow-auto"
                >
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      <AnimatePresence mode="popLayout">
                        {movements.map((movement, index) => {
                          const income = isIncomeMovement(movement.type);

                          return (
                            <motion.tr
                              key={movement.id}
                              layout
                              initial={{ opacity: 0, x: -15 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 15 }}
                              transition={{
                                duration: 0.3,
                                delay: index * 0.04,
                                ease: "easeOut",
                              }}
                              whileHover={{
                                backgroundColor: "hsl(var(--muted) / 0.5)",
                              }}
                              className="border-b last:border-0"
                            >
                              <TableCell className="whitespace-nowrap text-muted-foreground">
                                {formatDate(movement.createdAt)}
                              </TableCell>

                              <TableCell>
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${getMovementClassName(movement.type)}`}
                                >
                                  {income ? (
                                    <ArrowUpRight className="h-3 w-3" />
                                  ) : (
                                    <ArrowDownLeft className="h-3 w-3" />
                                  )}

                                  {getMovementLabel(movement.type)}
                                </span>
                              </TableCell>

                              <TableCell>
                                <span className="text-sm">
                                  {movement.description || "Sin descripción"}
                                </span>
                              </TableCell>

                              <TableCell className="text-right">
                                <span
                                  className={`font-semibold ${
                                    income
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {income ? "+" : "-"}
                                  {formatCurrency(Math.abs(movement.amount))}
                                </span>
                              </TableCell>
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </div>
  );
}
