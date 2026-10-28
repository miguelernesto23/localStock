"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronsUpDown,
  Plus,
  Trash2,
  Wallet,
  AlertTriangle,
} from "lucide-react";

import { createPurchase } from "@/action/purchase.action";
import { getProducts } from "@/action/product.action";
import { getActiveCashBox } from "@/action/cashbox.action";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { cn } from "@/lib/utils";

import {
  purchaseSchema,
  type PurchaseFormData,
} from "@/schema/purchase.schema";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { generateLotPrefix } from "../../lib/utils";
type PurchaseProduct = {
  id: number;
  name: string;
  costPrice: number;
  active: boolean;
  category?: {
    id: number;
    name: string;
  } | null;
};

type PurchaseItemState = {
  lineId: string;
  productId: number;
  productName: string;
  quantity: number;
  unitCost: number;
  lotCode: string;
  purchaseDate: string;
};

type CashBox = {
  id: number;
  name: string;
  currentBalance: number;
  currency: string;
};

type CreatePurchaseFormProps = {
  onCreated?: () => void;
};

function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function CreatePurchaseForm({ onCreated }: CreatePurchaseFormProps) {
  const [products, setProducts] = useState<PurchaseProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [cashBox, setCashBox] = useState<CashBox | null>(null);
  const [loadingCashBox, setLoadingCashBox] = useState(true);

  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );

  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [lotCode, setLotCode] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(getTodayDate());

  const [items, setItems] = useState<PurchaseItemState[]>([]);

  const [serverError, setServerError] = useState("");
  const [openProducts, setOpenProducts] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      supplierName: "",
      paymentType: "",
      notes: "",
      items: [],
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    setValue,
  } = form;

  const paymentType = useWatch({
    control,
    name: "paymentType",
  });

  /*
   * Cargar productos y caja activa.
   */
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingProducts(true);
        setLoadingCashBox(true);

        const [productsResult, cashBoxResult] = await Promise.all([
          getProducts(),
          getActiveCashBox(),
        ]);

        if (!productsResult.success) {
          setServerError(productsResult.error);
        } else {
          setProducts(
            productsResult.products.filter((product) => product.active),
          );
        }

        if (!cashBoxResult.success) {
          setServerError(cashBoxResult.error);
        } else {
          setCashBox(cashBoxResult.cashBox);
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
        setServerError("No se pudieron cargar los datos de la compra.");
      } finally {
        setLoadingProducts(false);
        setLoadingCashBox(false);
      }
    }

    loadData();
  }, []);

  /*
   * Producto seleccionado.
   */
  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId),
    [products, selectedProductId],
  );

  /*
   * Total de la compra.
   */
  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0),
    [items],
  );

  /*
   * Capital restante después de la compra.
   */
  const remainingCapital = useMemo(() => {
    if (!cashBox) return 0;

    if (paymentType === "CREDITO") {
      return cashBox.currentBalance;
    }

    return cashBox.currentBalance - total;
  }, [cashBox, total, paymentType]);

  const insufficientBalance =
    paymentType !== "CREDITO" &&
    cashBox !== null &&
    total > cashBox.currentBalance;

  /*
   * Sincronizar líneas con React Hook Form.
   */
  function syncItems(updatedItems: PurchaseItemState[]) {
    setItems(updatedItems);

    setValue(
      "items",
      updatedItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitCost: item.unitCost,
        lotCode: item.lotCode,
        purchaseDate: item.purchaseDate,
      })),
      {
        shouldValidate: true,
        shouldDirty: true,
      },
    );
  }

  /*
   * Seleccionar producto de referencia.
   */
  function handleSelectProduct(product: PurchaseProduct) {
    const prefix = generateLotPrefix(product.name);

    const nextNumber =
      items.filter((item) => item.lotCode.startsWith(`${prefix}-`)).length + 1;

    const generatedCode = `${prefix}-${String(nextNumber).padStart(3, "0")}`;

    setSelectedProductId(product.id);
    setUnitCost(String(product.costPrice));
    setQuantity("");
    setLotCode(generatedCode);
    setPurchaseDate(getTodayDate());
    setOpenProducts(false);
    setServerError("");
  }

  /*
   * Añadir una línea de compra.
   * Cada línea representa un lote independiente.
   */
  function handleAddItem() {
    setServerError("");

    if (!selectedProduct) {
      setServerError("Selecciona un producto.");
      return;
    }

    const parsedQuantity = Number(quantity);
    const parsedUnitCost = Number(unitCost);

    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      setServerError("La cantidad debe ser un número entero mayor que 0.");
      return;
    }

    if (!Number.isFinite(parsedUnitCost) || parsedUnitCost < 0) {
      setServerError("El costo unitario no puede ser negativo.");
      return;
    }

    if (!purchaseDate) {
      setServerError("Selecciona la fecha de compra del lote.");
      return;
    }

    const prefix = generateLotPrefix(selectedProduct.name);

    const nextNumber =
      items.filter((item) => item.lotCode.startsWith(`${prefix}-`)).length + 1;

    const generatedLotCode =
      lotCode.trim() || `${prefix}-${String(nextNumber).padStart(3, "0")}`;

    const updatedItems: PurchaseItemState[] = [
      ...items,
      {
        lineId: crypto.randomUUID(),
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity: parsedQuantity,
        unitCost: parsedUnitCost,
        lotCode: generatedLotCode,
        purchaseDate,
      },
    ];

    syncItems(updatedItems);

    setSelectedProductId(null);
    setQuantity("");
    setUnitCost("");
    setLotCode("");
    setPurchaseDate(getTodayDate());
    setOpenProducts(false);
  }

  /*
   * Eliminar una línea concreta.
   */
  function handleRemoveItem(lineId: string) {
    setServerError("");

    syncItems(items.filter((item) => item.lineId !== lineId));
  }

  /*
   * Registrar compra.
   */
  async function onSubmit(data: PurchaseFormData) {
    setServerError("");

    if (items.length === 0) {
      setServerError("La compra debe tener al menos un producto.");
      return;
    }

    if (
      paymentType !== "CREDITO" &&
      cashBox &&
      total > cashBox.currentBalance
    ) {
      setServerError(
        "El saldo de la caja no es suficiente para realizar esta compra.",
      );
      return;
    }

    setSubmitting(true);

    try {
      const purchaseItems = items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitCost: item.unitCost,
        lotCode: item.lotCode || undefined,
        purchaseDate: item.purchaseDate || undefined,
      }));

      const result = await createPurchase({
        supplierName: data.supplierName || undefined,
        paymentType: data.paymentType || undefined,
        notes: data.notes || undefined,
        total,
        items: purchaseItems,
      });

      if (!result.success) {
        setServerError(result.error);
        return;
      }

      reset();
      setItems([]);
      setSelectedProductId(null);
      setQuantity("");
      setUnitCost("");
      setLotCode("");
      setPurchaseDate(getTodayDate());
      setServerError("");

      const cashBoxResult = await getActiveCashBox();

      if (cashBoxResult.success) {
        setCashBox(cashBoxResult.cashBox);
      }

      onCreated?.();
    } catch (error) {
      console.error("Error creando compra:", error);
      setServerError("Ocurrió un error al registrar la compra.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="overflow-hidden rounded-xl border bg-card shadow-sm"
    >
      {/* CABECERA */}
      <div className="border-b px-6 py-5">
        <h2 className="text-lg font-semibold">Registrar compra</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Introduce los datos de la compra y agrega los lotes adquiridos.
        </p>
      </div>

      <div className="grid lg:grid-cols-[360px_minmax(0,1fr)]">
        {/* COLUMNA IZQUIERDA */}
        <div className="border-b p-6 lg:border-b-0 lg:border-r">
          {/* DATOS GENERALES */}
          <section>
            <div className="mb-5">
              <h3 className="font-semibold">Datos de la compra</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Información general.
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="supplierName" className="text-sm font-medium">
                  Proveedor
                </label>
                <Input
                  id="supplierName"
                  placeholder="Nombre del proveedor"
                  {...register("supplierName")}
                />
                {errors.supplierName && (
                  <p className="text-xs text-destructive">
                    {errors.supplierName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de pago</label>
                <Select
                  value={paymentType || ""}
                  onValueChange={(value) => {
                    form.setValue(
                      "paymentType",
                      value as "EFECTIVO" | "TRANSFERENCIA" | "CREDITO",
                      {
                        shouldValidate: true,
                        shouldDirty: true,
                      },
                    );
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                    <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                    <SelectItem value="CREDITO">Crédito</SelectItem>
                  </SelectContent>
                </Select>
                {errors.paymentType && (
                  <p className="text-xs text-destructive">
                    {errors.paymentType.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="notes" className="text-sm font-medium">
                  Notas
                </label>
                <textarea
                  id="notes"
                  rows={4}
                  placeholder="Observaciones..."
                  {...register("notes")}
                  className={cn(
                    "flex w-full resize-none rounded-md border",
                    "border-input bg-background px-3 py-2",
                    "text-sm placeholder:text-muted-foreground",
                    "focus-visible:outline-none focus-visible:ring-2",
                    "focus-visible:ring-ring",
                  )}
                />
                {errors.notes && (
                  <p className="text-xs text-destructive">
                    {errors.notes.message}
                  </p>
                )}
              </div>
            </div>
          </section>

          <div className="my-7 border-t" />

          {/* AGREGAR LOTE */}
          <section>
            <div className="mb-5">
              <h3 className="font-semibold">Agregar lote</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Selecciona el producto y registra los datos de esta partida.
              </p>
            </div>

            <div className="space-y-5">
              {/* PRODUCTO */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Producto</label>

                <Popover open={openProducts} onOpenChange={setOpenProducts}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={openProducts}
                      className="w-full justify-between font-normal"
                    >
                      <span
                        className={cn(
                          "truncate",
                          !selectedProduct && "text-muted-foreground",
                        )}
                      >
                        {selectedProduct
                          ? selectedProduct.name
                          : "Buscar producto..."}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent
                    className="w-(--radix-popover-trigFger-width) p-0"
                    align="start"
                  >
                    <Command>
                      <CommandInput placeholder="Buscar producto..." />
                      <CommandList>
                        {loadingProducts ? (
                          <CommandEmpty>Cargando productos...</CommandEmpty>
                        ) : products.length === 0 ? (
                          <CommandEmpty>No hay productos activos.</CommandEmpty>
                        ) : (
                          <>
                            <CommandEmpty>
                              No se encontró ningún producto.
                            </CommandEmpty>
                            <CommandGroup>
                              {products.map((product) => (
                                <CommandItem
                                  key={product.id}
                                  value={product.name}
                                  onSelect={() => handleSelectProduct(product)}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedProductId === product.id
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate">{product.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      Costo de referencia:{" "}
                                      {product.costPrice.toFixed(2)}
                                    </p>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* DATOS DEL LOTE */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label htmlFor="lotCode" className="text-sm font-medium">
                    Código del lote
                  </label>
                  <Input
                    id="lotCode"
                    placeholder="Ej. ACE-001"
                    value={lotCode}
                    onChange={(event) => setLotCode(event.target.value)}
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground">
                    Opcional; se genera uno si lo dejas vacío.
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="purchaseDate" className="text-sm font-medium">
                    Fecha de compra
                  </label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={purchaseDate}
                    onChange={(event) => setPurchaseDate(event.target.value)}
                  />
                </div>
              </div>

              {/* CANTIDAD Y COSTO */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label htmlFor="quantity" className="text-sm font-medium">
                    Cantidad
                  </label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="0"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="unitCost" className="text-sm font-medium">
                    Costo unitario
                  </label>
                  <Input
                    id="unitCost"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={unitCost}
                    onChange={(event) => setUnitCost(event.target.value)}
                  />
                </div>
              </div>

              <Button
                type="button"
                className="w-full"
                onClick={handleAddItem}
                disabled={!selectedProduct}
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar lote
              </Button>
            </div>
          </section>

          {/* ERROR */}
          {serverError && (
            <div className="mt-6 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </div>
          )}

          {/* REGISTRAR */}
          <Button
            type="submit"
            size="lg"
            className="mt-6 w-full"
            disabled={
              submitting ||
              items.length === 0 ||
              loadingCashBox ||
              (!!cashBox && paymentType !== "CREDITO" && insufficientBalance)
            }
          >
            {submitting ? "Registrando compra..." : "Registrar compra"}
          </Button>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="min-w-0 p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold">Lotes agregados</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Cada línea representa un lote independiente.
              </p>
            </div>
            <div className="rounded-md bg-muted px-3 py-2 text-right">
              <p className="text-xs text-muted-foreground">Lotes</p>
              <p className="font-semibold">{items.length}</p>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="flex min-h-[430px] items-center justify-center rounded-lg border border-dashed">
              <div className="max-w-sm px-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Plus className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="font-medium">No hay lotes agregados</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Los lotes que agregues aparecerán aquí.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="overflow-hidden rounded-lg border">
                <div className="max-h-[520px] overflow-auto">
                  <table className="w-full min-w-[850px] text-sm">
                    <thead className="sticky top-0 z-10 bg-muted">
                      <tr className="border-b">
                        <th className="px-4 py-3 text-left font-medium">
                          Producto / lote
                        </th>
                        <th className="px-4 py-3 text-left font-medium">
                          Fecha
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          Cantidad
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          Costo unit.
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          Subtotal
                        </th>
                        <th className="w-12 px-4 py-3" />
                      </tr>
                    </thead>

                    <tbody>
                      {items.map((item) => {
                        const subtotal = item.quantity * item.unitCost;

                        return (
                          <tr
                            key={item.lineId}
                            className="border-b last:border-0 hover:bg-muted/40"
                          >
                            <td className="max-w-[260px] px-4 py-3">
                              <p
                                className="truncate font-medium"
                                title={item.productName}
                              >
                                {item.productName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Lote: {item.lotCode || "Código automático"}
                              </p>
                            </td>

                            <td className="whitespace-nowrap px-4 py-3">
                              {item.purchaseDate}
                            </td>

                            <td className="px-4 py-3 text-right tabular-nums">
                              {item.quantity}
                            </td>

                            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                              {item.unitCost.toFixed(2)}
                            </td>

                            <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums">
                              {subtotal.toFixed(2)}
                            </td>

                            <td className="px-4 py-3 text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => handleRemoveItem(item.lineId)}
                                title="Eliminar lote"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TOTAL */}
              <div className="flex items-center justify-between border-t pt-5">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total de la compra
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {items.length} {items.length === 1 ? "lote" : "lotes"}
                  </p>
                </div>
                <p className="text-3xl font-bold tracking-tight">
                  {total.toLocaleString("es-CU", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  {cashBox?.currency ?? "CUP"}
                </p>
              </div>

              {/* RESUMEN DE CAPITAL */}
              {cashBox && (
                <div
                  className={cn(
                    "rounded-lg border p-4",
                    insufficientBalance
                      ? "border-destructive/30 bg-destructive/10"
                      : "bg-muted/30",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {paymentType === "CREDITO"
                          ? "Compra a crédito"
                          : "Saldo después de la compra"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {paymentType === "CREDITO"
                          ? "El capital no se modifica."
                          : "Saldo estimado al confirmar."}
                      </p>
                    </div>
                    <p
                      className={cn(
                        "text-xl font-bold tabular-nums",
                        insufficientBalance
                          ? "text-destructive"
                          : "text-primary",
                      )}
                    >
                      {remainingCapital.toLocaleString("es-CU", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      {cashBox.currency}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CAPITAL DISPONIBLE */}
          <div className="mt-2 rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">Capital disponible</p>
            </div>

            {loadingCashBox ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Cargando capital...
              </p>
            ) : !cashBox ? (
              <div className="mt-3">
                <p className="text-sm text-destructive">
                  No tienes una caja activa.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Crea una caja antes de realizar compras pagadas.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Disponible
                  </span>
                  <span className="font-semibold tabular-nums">
                    {cashBox.currentBalance.toLocaleString("es-CU", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    {cashBox.currency}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Total compra
                  </span>
                  <span className="font-medium tabular-nums">
                    {total.toLocaleString("es-CU", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    {cashBox.currency}
                  </span>
                </div>

                <div className="border-t" />

                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Capital restante</span>
                  <span
                    className={cn(
                      "font-bold tabular-nums",
                      insufficientBalance ? "text-destructive" : "text-primary",
                    )}
                  >
                    {remainingCapital.toLocaleString("es-CU", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    {cashBox.currency}
                  </span>
                </div>

                {paymentType === "CREDITO" && (
                  <p className="text-xs text-muted-foreground">
                    La compra a crédito no descuenta dinero de la caja.
                  </p>
                )}

                {insufficientBalance && (
                  <div className="flex gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      El saldo disponible no es suficiente para esta compra.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
