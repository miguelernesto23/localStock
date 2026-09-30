"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  CalendarDays,
  Eye,
  Loader2,
  PackageSearch,
  ShoppingCart,
} from "lucide-react";

import { getPurchases } from "@/action/purchase.action";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type PurchaseItem = {
  id: number;
  quantity: number;
  unitCost: number;
  subtotal: number;
  productName: string | null;
  productId: number | null;
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

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [error, setError] = useState("");

  /*
   * Cargar compras
   */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const result = await getPurchases();

        if (cancelled) return;

        if (!result.success) {
          setError(result.error);
          return;
        }

        setPurchases(result.purchases as Purchase[]);
      } catch (error) {
        if (cancelled) return;

        console.error("Error cargando compras:", error);
        setError("No se pudieron cargar las compras.");
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

  /*
   * Filtrar por fecha
   */
  const filteredPurchases = useMemo(() => {
    if (!selectedDate) return purchases;

    return purchases.filter((purchase) => {
      const purchaseDate = new Date(purchase.createdAt);

      const year = purchaseDate.getFullYear();
      const month = String(purchaseDate.getMonth() + 1).padStart(2, "0");
      const day = String(purchaseDate.getDate()).padStart(2, "0");

      const formattedDate = `${year}-${month}-${day}`;

      return formattedDate === selectedDate;
    });
  }, [purchases, selectedDate]);

  /*
   * Total de compras filtradas
   */
  const totalPurchases = useMemo(() => {
    return filteredPurchases.reduce(
      (total, purchase) => total + purchase.total,
      0,
    );
  }, [filteredPurchases]);

  /*
   * Formato moneda
   */
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CU", {
      style: "currency",
      currency: "CUP",
      minimumFractionDigits: 2,
    }).format(value);
  };

  /*
   * Formato fecha
   */
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-CU", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  };

  /*
   * Formato de fecha seleccionada
   */
  const formatSelectedDate = (date: string) => {
    if (!date) return "";

    const [year, month, day] = date.split("-");

    return new Intl.DateTimeFormat("es-CU", {
      dateStyle: "long",
    }).format(new Date(Number(year), Number(month) - 1, Number(day)));
  };

  /*
   * Tipo de pago
   */
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

  /*
   * Estilo del tipo de pago
   */
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

  return (
    <div className="space-y-6">
      {/* =====================================================
          HEADER
      ====================================================== */}
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
          <h1 className="text-2xl font-bold tracking-tight">
            Historial de compras
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Consulta y administra las compras registradas.
          </p>
        </div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button asChild>
            <Link href="/purchases/new">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Nueva compra
            </Link>
          </Button>
        </motion.div>
      </motion.div>

      {/* =====================================================
          MÉTRICAS
      ====================================================== */}
      {!loading && !error && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.45,
            delay: 0.1,
            ease: "easeOut",
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <motion.div
            whileHover={{
              y: -2,
              transition: { duration: 0.2 },
            }}
            className="rounded-xl border bg-card p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Compras registradas
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {filteredPurchases.length}
                </p>
              </div>

              <div className="rounded-lg bg-primary/10 p-3">
                <PackageSearch className="h-5 w-5 text-primary" />
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{
              y: -2,
              transition: { duration: 0.2 },
            }}
            className="rounded-xl border bg-card p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total comprado</p>

                <p className="mt-1 text-2xl font-bold">
                  {formatCurrency(totalPurchases)}
                </p>
              </div>

              <div className="rounded-lg bg-primary/10 p-3">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* =====================================================
          FILTRO POR FECHA
      ====================================================== */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.45,
          delay: 0.15,
          ease: "easeOut",
        }}
        className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <AnimatePresence mode="wait">
            <motion.p
              key={selectedDate || "all"}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="font-medium"
            >
              {selectedDate
                ? `Compras del ${formatSelectedDate(selectedDate)}`
                : "Historial de compras"}
            </motion.p>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.p
              key={`${selectedDate}-${filteredPurchases.length}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-sm text-muted-foreground"
            >
              {filteredPurchases.length}{" "}
              {filteredPurchases.length === 1
                ? "compra encontrada"
                : "compras encontradas"}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="pl-9"
            />
          </div>

          <AnimatePresence>
            {selectedDate && (
              <motion.div
                initial={{ opacity: 0, width: 0, scale: 0.95 }}
                animate={{ opacity: 1, width: "auto", scale: 1 }}
                exit={{ opacity: 0, width: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <Button
                  variant="outline"
                  onClick={() => setSelectedDate("")}
                  className="w-full sm:w-auto"
                >
                  Mostrar todas
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* =====================================================
          ERROR
      ====================================================== */}
      {error && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center"
        >
          <p className="font-medium text-destructive">{error}</p>

          <p className="mt-1 text-sm text-muted-foreground">
            Intenta cargar nuevamente las compras.
          </p>
        </motion.div>
      )}

      {/* =====================================================
          LOADING
      ====================================================== */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex min-h-75 flex-col items-center justify-center rounded-xl border bg-card shadow-sm"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <Loader2 className="h-7 w-7 text-primary" />
          </motion.div>

          <p className="mt-3 text-sm text-muted-foreground">
            Cargando compras...
          </p>
        </motion.div>
      )}

      {/* =====================================================
          TABLA
      ====================================================== */}
      {!loading && !error && filteredPurchases.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: 0.2,
            ease: "easeOut",
          }}
          className="overflow-hidden rounded-xl border bg-card shadow-sm"
        >
          <div className="max-h-[60vh] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
                <TableRow>
                  <TableHead>Compra</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                <AnimatePresence mode="popLayout">
                  {filteredPurchases.map((purchase, index) => (
                    <motion.tr
                      key={purchase.id}
                      layout
                      initial={{
                        opacity: 0,
                        x: -15,
                      }}
                      animate={{
                        opacity: 1,
                        x: 0,
                      }}
                      exit={{
                        opacity: 0,
                        x: 15,
                      }}
                      transition={{
                        duration: 0.3,
                        delay: index * 0.04,
                        ease: "easeOut",
                      }}
                      whileHover={{
                        backgroundColor: "hsl(var(--muted) / 0.5)",
                        transition: {
                          duration: 0.15,
                        },
                      }}
                    >
                      {/* Compra */}
                      <TableCell>
                        <div>
                          <p className="font-medium">#{purchase.id}</p>

                          <p className="text-xs text-muted-foreground">
                            {purchase.user.name}
                          </p>
                        </div>
                      </TableCell>

                      {/* Proveedor */}
                      <TableCell>
                        <span className="text-sm">
                          {purchase.supplierName || "Sin proveedor"}
                        </span>
                      </TableCell>

                      {/* Productos */}
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {purchase.items.length}{" "}
                            {purchase.items.length === 1
                              ? "producto"
                              : "productos"}
                          </p>

                          <p className="max-w-50 truncate text-xs text-muted-foreground">
                            {purchase.items
                              .map(
                                (item) =>
                                  `${item.productName ?? "Producto"} × ${item.quantity}`,
                              )
                              .join(", ")}
                          </p>
                        </div>
                      </TableCell>

                      {/* Pago */}
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getPaymentClassName(
                            purchase.paymentType,
                          )}`}
                        >
                          {getPaymentLabel(purchase.paymentType)}
                        </span>
                      </TableCell>

                      {/* Total */}
                      <TableCell>
                        <span className="font-semibold">
                          {formatCurrency(purchase.total)}
                        </span>
                      </TableCell>

                      {/* Fecha */}
                      <TableCell>
                        <span className="whitespace-nowrap text-sm text-muted-foreground">
                          {formatDate(purchase.createdAt)}
                        </span>
                      </TableCell>

                      {/* Acción */}
                      <TableCell className="text-right">
                        <motion.div
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          className="inline-block"
                        >
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/purchases/${purchase.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver
                            </Link>
                          </Button>
                        </motion.div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        </motion.div>
      )}

      {/* =====================================================
          EMPTY STATE
      ====================================================== */}
      {!loading && !error && filteredPurchases.length === 0 && (
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.97,
            y: 10,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
          }}
          transition={{
            duration: 0.35,
            ease: "easeOut",
          }}
          className="flex min-h-75 flex-col items-center justify-center rounded-xl border bg-card p-6 text-center shadow-sm"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 0.35,
              delay: 0.1,
            }}
            className="rounded-full bg-muted p-4"
          >
            <PackageSearch className="h-8 w-8 text-muted-foreground" />
          </motion.div>

          <h3 className="mt-4 font-semibold">
            {selectedDate
              ? "No hay compras en esta fecha"
              : "No hay compras registradas"}
          </h3>

          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {selectedDate
              ? "Prueba seleccionando otra fecha o muestra todas las compras."
              : "Cuando registres una compra aparecerá aquí."}
          </p>

          {selectedDate && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setSelectedDate("")}
              >
                Mostrar todas
              </Button>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
