"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Calculator,
  Plus,
  RotateCcw,
  ShoppingCart,
  Trash2,
} from "lucide-react";

import { getActiveCashBoxBalance } from "@/action/cashbox.action";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ShoppingItem = {
  id: number;
  name: string;
  quantity: number;
  unitCost: number;
};

const cardAnimation = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  transition: {
    duration: 0.35,
  },
};

export default function ShoppingListPage() {
  const [budget, setBudget] = useState("");
  const [items, setItems] = useState<ShoppingItem[]>([]);

  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");

  const [cashBalance, setCashBalance] = useState<number | null>(null);

  const [cashBoxName, setCashBoxName] = useState("");
  const [cashLoading, setCashLoading] = useState(true);

  useEffect(() => {
    async function loadCashBox() {
      setCashLoading(true);

      const result = await getActiveCashBoxBalance();

      if (result.success) {
        setCashBalance(result.balance);
        setCashBoxName(result.name);
      }

      setCashLoading(false);
    }

    loadCashBox();
  }, []);

  function addItem() {
    const name = productName.trim();
    const parsedQuantity = Number(quantity);
    const parsedUnitCost = Number(unitCost);

    if (!name) return;

    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      return;
    }

    if (!Number.isFinite(parsedUnitCost) || parsedUnitCost < 0) {
      return;
    }

    const newItem: ShoppingItem = {
      id: Date.now(),
      name,
      quantity: parsedQuantity,
      unitCost: parsedUnitCost,
    };

    setItems((current) => [...current, newItem]);

    setProductName("");
    setQuantity("");
    setUnitCost("");
  }

  function removeItem(id: number) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  function clearList() {
    setItems([]);
    setBudget("");
    setProductName("");
    setQuantity("");
    setUnitCost("");
  }

  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
  }, [items]);

  const budgetValue = Number(budget);

  const remaining =
    Number.isFinite(budgetValue) && budgetValue >= 0
      ? budgetValue - total
      : null;

  const remainingCash = cashBalance !== null ? cashBalance - total : null;

  function formatCurrency(value: number) {
    return `${value.toLocaleString("es-CU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} CUP`;
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <ShoppingCart className="h-4 w-4" />

            <span>Herramientas</span>

            <span>/</span>

            <span>Lista de compras</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            Lista de compras
          </h1>

          <p className="text-muted-foreground">
            Planifica tu compra y calcula cuánto vas a gastar.
          </p>
        </div>

        <AnimatePresence>
          {items.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Button variant="outline" onClick={clearList}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Limpiar
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Presupuesto */}
      <motion.div
        {...cardAnimation}
        transition={{
          ...cardAnimation.transition,
          delay: 0.05,
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Presupuesto
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Caja activa</p>

                <p className="text-lg font-semibold">
                  {cashLoading
                    ? "Cargando..."
                    : cashBoxName || "Sin caja activa"}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Saldo disponible
                </p>

                <motion.p
                  key={cashBalance}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl font-bold"
                >
                  {cashLoading
                    ? "Cargando..."
                    : cashBalance !== null
                      ? formatCurrency(cashBalance)
                      : "—"}
                </motion.p>
              </div>
            </div>

            <div className="mt-6 max-w-sm space-y-2">
              <label className="text-sm font-medium">
                Presupuesto para esta compra
              </label>

              <Input
                type="number"
                min="0"
                step="0.01"
                value={budget}
                onChange={(event) => setBudget(event.target.value)}
                placeholder={
                  cashBalance !== null ? cashBalance.toString() : "Ej. 10000"
                }
              />

              <p className="text-xs text-muted-foreground">
                Puedes utilizar todo el saldo de la caja o solamente una parte.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Agregar producto */}
      <motion.div
        {...cardAnimation}
        transition={{
          ...cardAnimation.transition,
          delay: 0.1,
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Agregar producto</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr_auto]">
              <div className="space-y-2">
                <label className="text-sm font-medium">Producto</label>

                <Input
                  value={productName}
                  onChange={(event) => setProductName(event.target.value)}
                  placeholder="Ej. Arroz"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Cantidad</label>

                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Costo unitario</label>

                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={unitCost}
                  onChange={(event) => setUnitCost(event.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={addItem}
                  className="w-full md:w-auto"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Lista */}
      <motion.div
        {...cardAnimation}
        transition={{
          ...cardAnimation.transition,
          delay: 0.15,
        }}
      >
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle>Productos</CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            <AnimatePresence mode="popLayout" initial={false}>
              {items.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center px-6 py-16 text-center"
                >
                  <ShoppingCart className="mb-4 h-10 w-10 text-muted-foreground" />

                  <p className="font-medium">No hay productos en la lista</p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Agrega productos para comenzar a calcular tu compra.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="products"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="hidden grid-cols-[1fr_100px_160px_160px_60px] gap-4 border-b bg-muted/20 px-6 py-3 text-sm font-medium text-muted-foreground md:grid">
                    <span>Producto</span>
                    <span>Cantidad</span>
                    <span>Costo unitario</span>
                    <span className="text-right">Subtotal</span>
                    <span />
                  </div>

                  <div className="divide-y">
                    <AnimatePresence initial={false} mode="popLayout">
                      {items.map((item) => {
                        const subtotal = item.quantity * item.unitCost;

                        return (
                          <motion.div
                            key={item.id}
                            layout
                            initial={{
                              opacity: 0,
                              x: -20,
                              scale: 0.98,
                            }}
                            animate={{
                              opacity: 1,
                              x: 0,
                              scale: 1,
                            }}
                            exit={{
                              opacity: 0,
                              x: 20,
                              scale: 0.96,
                            }}
                            transition={{
                              duration: 0.25,
                            }}
                            className="grid gap-4 px-6 py-4 md:grid-cols-[1fr_100px_160px_160px_60px] md:items-center"
                          >
                            <div>
                              <p className="font-medium">{item.name}</p>

                              <p className="text-xs text-muted-foreground md:hidden">
                                {item.quantity} ×{" "}
                                {formatCurrency(item.unitCost)}
                              </p>
                            </div>

                            <div className="hidden md:block">
                              {item.quantity}
                            </div>

                            <div className="hidden md:block">
                              {formatCurrency(item.unitCost)}
                            </div>

                            <motion.div
                              key={subtotal}
                              initial={{
                                opacity: 0.4,
                                scale: 0.95,
                              }}
                              animate={{
                                opacity: 1,
                                scale: 1,
                              }}
                              className="font-semibold md:text-right"
                            >
                              {formatCurrency(subtotal)}
                            </motion.div>

                            <div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeItem(item.id)}
                                title="Eliminar producto"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Resumen */}
      <motion.div
        {...cardAnimation}
        transition={{
          ...cardAnimation.transition,
          delay: 0.2,
        }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Productos</p>

                <motion.p
                  key={items.length}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl font-semibold"
                >
                  {items.length}
                </motion.p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Total de la compra
                </p>

                <motion.p
                  key={total}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl font-bold"
                >
                  {formatCurrency(total)}
                </motion.p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Presupuesto restante
                </p>

                <motion.p
                  key={remaining}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-2xl font-bold ${
                    remaining !== null && remaining < 0
                      ? "text-destructive"
                      : ""
                  }`}
                >
                  {remaining === null
                    ? "—"
                    : formatCurrency(Math.abs(remaining))}
                </motion.p>

                {remaining !== null && remaining < 0 && (
                  <p className="text-xs text-destructive">
                    Has excedido el presupuesto.
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Saldo de caja después
                </p>

                <motion.p
                  key={remainingCash}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-2xl font-bold ${
                    remainingCash !== null && remainingCash < 0
                      ? "text-destructive"
                      : ""
                  }`}
                >
                  {remainingCash === null
                    ? "—"
                    : formatCurrency(Math.abs(remainingCash))}
                </motion.p>

                {remainingCash !== null && remainingCash < 0 && (
                  <p className="text-xs text-destructive">
                    La compra supera el saldo actual de la caja.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
