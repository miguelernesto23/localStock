"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { CalendarDays, Eye, Loader2, Plus, ShoppingCart } from "lucide-react";

import { getSales } from "@/action/sale.action";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { toast } from "sonner";

type SaleItem = {
  id: number;
  quantity: number;
  unitPrice: number | null;
  subtotal: number;
  productName: string | null;
  productId: number | null;
};

type Sale = {
  id: number;
  total: number;
  profit: number;
  paymentType: string | null;
  createdAt: Date;
  items: SaleItem[];
};

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
   * ============================================================
   * CARGAR VENTAS
   * ============================================================
   */

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const result = await getSales();

        if (cancelled) return;

        if (!result.success) {
          setError(result.error);
          return;
        }

        setSales(result.sales);
      } catch (error) {
        if (cancelled) return;

        console.error("Error cargando ventas:", error);

        setError("No se pudieron cargar las ventas.");

        toast.error("No se pudieron cargar las ventas", {
          position: "top-center",
        });
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
   * ============================================================
   * FILTRAR VENTAS POR FECHA
   * ============================================================
   */

  const filteredSales = useMemo(() => {
    if (!selectedDate) {
      return sales;
    }

    return sales.filter((sale) => {
      const saleDate = new Date(sale.createdAt);

      const year = saleDate.getFullYear();
      const month = String(saleDate.getMonth() + 1).padStart(2, "0");
      const day = String(saleDate.getDate()).padStart(2, "0");

      const formattedDate = `${year}-${month}-${day}`;

      return formattedDate === selectedDate;
    });
  }, [sales, selectedDate]);

  /*
   * ============================================================
   * TOTAL VENDIDO
   * ============================================================
   */

  const totalSales = useMemo(() => {
    return filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  }, [filteredSales]);

  /*
   * ============================================================
   * GANANCIA
   * ============================================================
   */

  const totalProfit = useMemo(() => {
    return filteredSales.reduce((sum, sale) => sum + sale.profit, 0);
  }, [filteredSales]);

  /*
   * ============================================================
   * FORMATEAR MONEDA
   * ============================================================
   */

  function formatCurrency(value: number) {
    return `${value.toLocaleString("es-CU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} CUP`;
  }

  /*
   * ============================================================
   * FORMATEAR FECHA
   * ============================================================
   */

  function formatDate(date: Date) {
    return new Date(date).toLocaleString("es-CU", {
      dateStyle: "short",
      timeStyle: "short",
    });
  }

  /*
   * ============================================================
   * TIPO DE PAGO
   * ============================================================
   */

  function getPaymentLabel(paymentType: string | null) {
    switch (paymentType) {
      case "EFECTIVO":
        return "Efectivo";

      case "TRANSFERENCIA":
        return "Transferencia";

      case "CREDITO":
        return "Crédito";

      default:
        return paymentType ?? "No especificado";
    }
  }

  /*
   * ============================================================
   * ESTILO TIPO DE PAGO
   * ============================================================
   */

  function getPaymentClassName(paymentType: string | null) {
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
  }

  /*
   * ============================================================
   * FECHA SELECCIONADA
   * ============================================================
   */

  function formatSelectedDate(date: string) {
    if (!date) return "";

    const [year, month, day] = date.split("-");

    return `${day}/${month}/${year}`;
  }

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (loading) {
    return (
      <div className="container mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.45,
            ease: "easeOut",
          }}
        >
          <h1 className="text-3xl font-bold tracking-tight">Ventas</h1>

          <p className="mt-1 text-muted-foreground">
            Historial de ventas realizadas.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.45,
            delay: 0.1,
          }}
        >
          <Card>
            <CardContent className="flex min-h-75 flex-col items-center justify-center">
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
                Cargando ventas...
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div className="container mx-auto space-y-6">
      {/* ======================================================
          HEADER
      ======================================================= */}

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
              initial={{
                opacity: 0,
                scale: 0.8,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              transition={{
                duration: 0.35,
                delay: 0.1,
              }}
            >
              <ShoppingCart className="h-6 w-6 text-primary" />
            </motion.div>

            <h1 className="text-3xl font-bold tracking-tight">Ventas</h1>
          </div>

          <p className="mt-1 text-muted-foreground">
            Consulta y administra las ventas realizadas.
          </p>
        </div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button asChild>
            <Link href="/sales/new">
              <Plus className="mr-2 h-4 w-4" />
              Nueva venta
            </Link>
          </Button>
        </motion.div>
      </motion.div>

      {/* ======================================================
          ERROR
      ======================================================= */}

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{
              opacity: 0,
              y: -10,
              height: 0,
            }}
            animate={{
              opacity: 1,
              y: 0,
              height: "auto",
            }}
            exit={{
              opacity: 0,
              y: -10,
              height: 0,
            }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="py-4">
                <p className="text-sm text-destructive">{error}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================================================
          MÉTRICAS
      ======================================================= */}

      <motion.div
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.45,
          delay: 0.1,
          ease: "easeOut",
        }}
        className="grid gap-4 md:grid-cols-3"
      >
        {/* Ventas */}
        <motion.div
          whileHover={{
            y: -3,
            transition: { duration: 0.2 },
          }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {selectedDate ? "Ventas del día" : "Ventas registradas"}
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{
                    scale: 0.8,
                    opacity: 0,
                  }}
                  animate={{
                    scale: 1,
                    opacity: 1,
                  }}
                  transition={{
                    duration: 0.3,
                    delay: 0.2,
                  }}
                  className="rounded-lg bg-primary/10 p-2"
                >
                  <ShoppingCart className="h-5 w-5 text-primary" />
                </motion.div>

                <AnimatePresence mode="wait">
                  <motion.p
                    key={filteredSales.length}
                    initial={{
                      opacity: 0,
                      y: 8,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    exit={{
                      opacity: 0,
                      y: -8,
                    }}
                    transition={{
                      duration: 0.2,
                    }}
                    className="text-2xl font-bold"
                  >
                    {filteredSales.length}
                  </motion.p>
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Total vendido */}
        <motion.div
          whileHover={{
            y: -3,
            transition: { duration: 0.2 },
          }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {selectedDate ? "Total vendido del día" : "Total vendido"}
              </CardTitle>
            </CardHeader>

            <CardContent>
              <AnimatePresence mode="wait">
                <motion.p
                  key={totalSales}
                  initial={{
                    opacity: 0,
                    y: 8,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -8,
                  }}
                  transition={{
                    duration: 0.2,
                  }}
                  className="text-2xl font-bold"
                >
                  {formatCurrency(totalSales)}
                </motion.p>
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Ganancia */}
        <motion.div
          whileHover={{
            y: -3,
            transition: { duration: 0.2 },
          }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {selectedDate ? "Ganancia del día" : "Ganancia estimada"}
              </CardTitle>
            </CardHeader>

            <CardContent>
              <AnimatePresence mode="wait">
                <motion.p
                  key={totalProfit}
                  initial={{
                    opacity: 0,
                    y: 8,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -8,
                  }}
                  transition={{
                    duration: 0.2,
                  }}
                  className="text-2xl font-bold"
                >
                  {formatCurrency(totalProfit)}
                </motion.p>
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* ======================================================
          HISTORIAL
      ======================================================= */}

      <motion.div
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.5,
          delay: 0.2,
          ease: "easeOut",
        }}
      >
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Historial de ventas</CardTitle>

                <AnimatePresence mode="wait">
                  {selectedDate && (
                    <motion.p
                      key={selectedDate}
                      initial={{
                        opacity: 0,
                        y: 5,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      exit={{
                        opacity: 0,
                        y: -5,
                      }}
                      transition={{
                        duration: 0.2,
                      }}
                      className="mt-1 text-sm text-muted-foreground"
                    >
                      Mostrando ventas del {formatSelectedDate(selectedDate)}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Filtro */}
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
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
                      initial={{
                        opacity: 0,
                        width: 0,
                        scale: 0.95,
                      }}
                      animate={{
                        opacity: 1,
                        width: "auto",
                        scale: 1,
                      }}
                      exit={{
                        opacity: 0,
                        width: 0,
                        scale: 0.95,
                      }}
                      transition={{
                        duration: 0.2,
                      }}
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
            </div>
          </CardHeader>

          <CardContent>
            <AnimatePresence mode="wait">
              {filteredSales.length === 0 ? (
                /* =================================================
                   EMPTY STATE
                ================================================== */
                <motion.div
                  key="empty"
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
                  exit={{
                    opacity: 0,
                    scale: 0.97,
                  }}
                  transition={{
                    duration: 0.3,
                  }}
                  className="flex min-h-62.5 flex-col items-center justify-center text-center"
                >
                  <motion.div
                    initial={{
                      opacity: 0,
                      scale: 0.8,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                    }}
                    transition={{
                      duration: 0.35,
                      delay: 0.1,
                    }}
                    className="rounded-full bg-muted p-4"
                  >
                    <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                  </motion.div>

                  <p className="mt-4 font-medium">
                    {selectedDate
                      ? "No hay ventas para esta fecha."
                      : "Todavía no hay ventas."}
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedDate
                      ? "Selecciona otra fecha para consultar sus ventas."
                      : "Registra tu primera venta para verla aquí."}
                  </p>

                  {selectedDate && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: 5,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        delay: 0.15,
                      }}
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
              ) : (
                /* =================================================
                   TABLA
                ================================================== */
                <motion.div
                  key={`table-${selectedDate || "all"}`}
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -10,
                  }}
                  transition={{
                    duration: 0.3,
                  }}
                  className="max-h-[45vh] overflow-auto"
                >
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
                      <TableRow>
                        <TableHead>Venta</TableHead>
                        <TableHead>Productos</TableHead>
                        <TableHead>Pago</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Ganancia</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-center">Acción</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      <AnimatePresence mode="popLayout">
                        {filteredSales.map((sale, index) => {
                          const totalItems = sale.items.reduce(
                            (sum, item) => sum + item.quantity,
                            0,
                          );

                          return (
                            <motion.tr
                              key={sale.id}
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
                              }}
                              className="border-b last:border-0"
                            >
                              {/* Venta */}
                              <TableCell className="font-medium">
                                <div>
                                  <p>#{sale.id}</p>

                                  <p className="text-xs text-muted-foreground">
                                    Venta registrada
                                  </p>
                                </div>
                              </TableCell>

                              {/* Productos */}
                              <TableCell>
                                <span className="font-medium">
                                  {totalItems}
                                </span>

                                <span className="ml-1 text-sm text-muted-foreground">
                                  {totalItems === 1 ? "unidad" : "unidades"}
                                </span>
                              </TableCell>

                              {/* Pago */}
                              <TableCell>
                                <span
                                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getPaymentClassName(
                                    sale.paymentType,
                                  )}`}
                                >
                                  {getPaymentLabel(sale.paymentType)}
                                </span>
                              </TableCell>

                              {/* Total */}
                              <TableCell>
                                <span className="font-semibold">
                                  {formatCurrency(sale.total)}
                                </span>
                              </TableCell>

                              {/* Ganancia */}
                              <TableCell>
                                <span className="font-medium text-green-600 dark:text-green-400">
                                  {formatCurrency(sale.profit)}
                                </span>
                              </TableCell>

                              {/* Fecha */}
                              <TableCell>
                                <span className="whitespace-nowrap text-sm text-muted-foreground">
                                  {formatDate(sale.createdAt)}
                                </span>
                              </TableCell>

                              {/* Acción */}
                              <TableCell className="text-center">
                                <motion.div
                                  whileHover={{
                                    scale: 1.04,
                                  }}
                                  whileTap={{
                                    scale: 0.96,
                                  }}
                                  className="inline-block"
                                >
                                  <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/sales/${sale.id}`}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      Ver
                                    </Link>
                                  </Button>
                                </motion.div>
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
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
