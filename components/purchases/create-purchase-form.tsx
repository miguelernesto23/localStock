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
import { toast } from "sonner";

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

import { cn, generateLotPrefix } from "@/lib/utils";

import {
  purchaseSchema,
  type PurchaseFormData,
} from "@/schema/purchase.schema";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// --------------------------------------------------
// TIPOS
// --------------------------------------------------

type PurchaseProduct = {
  id: number;
  name: string;
  unit: string;
  costPrice: number;
  active: boolean;

  category?: {
    id: number;
    name: string;
  } | null;

  presentations: {
    id: number;
    name: string;
    factor: number;
    canPurchase: boolean;
    active: boolean;
  }[];
};

type PurchaseItemState = {
  lineId: string;
  productId: number;
  productName: string;
  baseUnit: string;
  presentationId: number;
  presentationName: string;
  presentationFactor: number;
  purchasedQuantity: number;
  purchasedUnitCost: number;
  baseQuantity: number;
  baseUnitCost: number;
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

// --------------------------------------------------
// UTILIDADES
// --------------------------------------------------

function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatMoney(value: number) {
  return value.toLocaleString("es-CU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// --------------------------------------------------
// COMPONENTE
// --------------------------------------------------

export function CreatePurchaseForm({ onCreated }: CreatePurchaseFormProps) {
  const [products, setProducts] = useState<PurchaseProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [cashBox, setCashBox] = useState<CashBox | null>(null);
  const [loadingCashBox, setLoadingCashBox] = useState(true);

  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );

  const [selectedPresentationId, setSelectedPresentationId] = useState<
    number | null
  >(null);

  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [lotCode, setLotCode] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");

  const [items, setItems] = useState<PurchaseItemState[]>([]);

  const [serverError, setServerError] = useState("");
  const [openProducts, setOpenProducts] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // --------------------------------------------------
  // REACT HOOK FORM
  // --------------------------------------------------

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

  // --------------------------------------------------
  // CARGAR PRODUCTOS Y CAJA
  // --------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoadingProducts(true);
        setLoadingCashBox(true);

        const [productsResult, cashBoxResult] = await Promise.all([
          getProducts(),
          getActiveCashBox(),
        ]);

        if (cancelled) return;

        if (!productsResult.success) {
          setServerError(productsResult.error);
          toast.error(productsResult.error);
        } else {
          setProducts(
            productsResult.products.filter((product) => product.active),
          );
        }

        if (!cashBoxResult.success) {
          setServerError(cashBoxResult.error);
          toast.error(cashBoxResult.error);
        } else {
          setCashBox(cashBoxResult.cashBox);
        }
      } catch (error) {
        if (cancelled) return;

        console.error("Error cargando datos:", error);

        const message = "No se pudieron cargar los datos de la compra.";

        setServerError(message);
        toast.error(message);
      } finally {
        if (!cancelled) {
          setLoadingProducts(false);
          setLoadingCashBox(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  // --------------------------------------------------
  // PRODUCTO SELECCIONADO
  // --------------------------------------------------

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId),
    [products, selectedProductId],
  );

  // --------------------------------------------------
  // PRESENTACIÓN SELECCIONADA
  // --------------------------------------------------

  const selectedPresentation = useMemo(
    () =>
      selectedProduct?.presentations.find(
        (presentation) => presentation.id === selectedPresentationId,
      ),
    [selectedProduct, selectedPresentationId],
  );

  // --------------------------------------------------
  // CÁLCULOS DE LA PRESENTACIÓN
  // --------------------------------------------------

  const parsedQuantity = Number(quantity);
  const parsedUnitCost = Number(unitCost);

  const previewBaseQuantity =
    selectedPresentation && Number.isFinite(parsedQuantity)
      ? parsedQuantity * selectedPresentation.factor
      : 0;

  const previewBaseUnitCost =
    selectedPresentation &&
    selectedPresentation.factor > 0 &&
    Number.isFinite(parsedUnitCost)
      ? parsedUnitCost / selectedPresentation.factor
      : 0;

  const previewSubtotal =
    Number.isFinite(parsedQuantity) && Number.isFinite(parsedUnitCost)
      ? parsedQuantity * parsedUnitCost
      : 0;

  // --------------------------------------------------
  // TOTAL DE LA COMPRA
  // --------------------------------------------------

  const total = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + item.purchasedQuantity * item.purchasedUnitCost,
        0,
      ),
    [items],
  );

  // --------------------------------------------------
  // CAPITAL RESTANTE
  // --------------------------------------------------

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

  // --------------------------------------------------
  // SINCRONIZAR CON REACT HOOK FORM
  // --------------------------------------------------

  function syncItems(updatedItems: PurchaseItemState[]) {
    setItems(updatedItems);

    const formItems: PurchaseFormData["items"] = updatedItems.map((item) => ({
      productId: item.productId,
      presentationId: item.presentationId,
      purchasedQuantity: item.purchasedQuantity,
      purchasedUnitCost: item.purchasedUnitCost,
      lotCode: item.lotCode,
      purchaseDate: item.purchaseDate,
    }));

    setValue("items", formItems, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }

  // --------------------------------------------------
  // GENERAR CÓDIGO DE LOTE
  // --------------------------------------------------

  function generateItemLotCode(productName: string) {
    const prefix = generateLotPrefix(productName);

    const nextNumber =
      items.filter((item) => item.lotCode.startsWith(`${prefix}-`)).length + 1;

    return `${prefix}-${String(nextNumber).padStart(3, "0")}`;
  }

  // --------------------------------------------------
  // SELECCIONAR PRODUCTO
  // --------------------------------------------------

  function handleSelectProduct(product: PurchaseProduct) {
    const availablePresentations = product.presentations.filter(
      (presentation) => presentation.active && presentation.canPurchase,
    );

    setSelectedProductId(product.id);

    if (availablePresentations.length === 0) {
      setSelectedPresentationId(null);
      setUnitCost("");
    } else {
      const firstPresentation = availablePresentations[0];

      setSelectedPresentationId(firstPresentation.id);
      setUnitCost(String(product.costPrice * firstPresentation.factor));
    }

    setQuantity("");
    setLotCode(generateItemLotCode(product.name));
    setPurchaseDate(getTodayDate());
    setOpenProducts(false);
    setServerError("");
  }

  // --------------------------------------------------
  // CAMBIAR PRESENTACIÓN
  // --------------------------------------------------

  function handleSelectPresentation(value: string) {
    if (!selectedProduct) return;

    const presentationId = Number(value);

    const presentation = selectedProduct.presentations.find(
      (item) => item.id === presentationId,
    );

    if (!presentation) return;

    setSelectedPresentationId(presentation.id);

    setUnitCost(String(selectedProduct.costPrice * presentation.factor));
  }

  // --------------------------------------------------
  // AÑADIR LOTE
  // --------------------------------------------------

  function handleAddItem() {
    setServerError("");

    if (!selectedProduct) {
      const message = "Selecciona un producto.";
      setServerError(message);
      toast.error(message);
      return;
    }

    if (!selectedPresentation) {
      const message = "Selecciona una presentación válida para este producto.";
      setServerError(message);
      toast.error(message);
      return;
    }

    const parsedQuantity = Number(quantity);
    const parsedUnitCost = Number(unitCost);

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      const message = "La cantidad debe ser mayor que 0.";
      setServerError(message);
      toast.error(message);
      return;
    }

    if (!Number.isFinite(parsedUnitCost) || parsedUnitCost < 0) {
      const message = "El costo por presentación no puede ser negativo.";
      setServerError(message);
      toast.error(message);
      return;
    }

    if (
      !Number.isFinite(selectedPresentation.factor) ||
      selectedPresentation.factor <= 0
    ) {
      const message =
        "El factor de conversión de esta presentación no es válido.";

      setServerError(message);
      toast.error(message);
      return;
    }

    if (!purchaseDate) {
      const message = "Selecciona la fecha de compra del lote.";
      setServerError(message);
      toast.error(message);
      return;
    }

    const baseQuantity = parsedQuantity * selectedPresentation.factor;
    const baseUnitCost = parsedUnitCost / selectedPresentation.factor;

    if (!Number.isFinite(baseQuantity) || !Number.isFinite(baseUnitCost)) {
      const message = "No se pudieron calcular las unidades del lote.";
      setServerError(message);
      toast.error(message);
      return;
    }

    const generatedLotCode =
      lotCode.trim() || generateItemLotCode(selectedProduct.name);

    const updatedItems: PurchaseItemState[] = [
      ...items,
      {
        lineId: crypto.randomUUID(),

        productId: selectedProduct.id,
        productName: selectedProduct.name,
        baseUnit: selectedProduct.unit,

        presentationId: selectedPresentation.id,
        presentationName: selectedPresentation.name,
        presentationFactor: selectedPresentation.factor,

        purchasedQuantity: parsedQuantity,
        purchasedUnitCost: parsedUnitCost,

        baseQuantity,
        baseUnitCost,

        lotCode: generatedLotCode,
        purchaseDate,
      },
    ];

    syncItems(updatedItems);

    setSelectedProductId(null);
    setSelectedPresentationId(null);
    setQuantity("");
    setUnitCost("");
    setLotCode("");
    setPurchaseDate("");

    toast.success("Lote agregado correctamente.");
  }

  // --------------------------------------------------
  // ELIMINAR LOTE
  // --------------------------------------------------

  function handleRemoveItem(lineId: string) {
    setServerError("");

    syncItems(items.filter((item) => item.lineId !== lineId));

    toast.success("Lote eliminado.");
  }

  // --------------------------------------------------
  // REGISTRAR COMPRA
  // --------------------------------------------------

  async function onSubmit(data: PurchaseFormData) {
    setServerError("");

    if (items.length === 0) {
      const message = "La compra debe tener al menos un producto.";
      setServerError(message);
      toast.error(message);
      return;
    }

    if (
      paymentType !== "CREDITO" &&
      cashBox &&
      total > cashBox.currentBalance
    ) {
      const message =
        "El saldo de la caja no es suficiente para realizar esta compra.";

      setServerError(message);
      toast.error(message);
      return;
    }

    setSubmitting(true);

    const registeredTotal = total;
    const currency = cashBox?.currency ?? "CUP";

    try {
      const purchaseItems = items.map((item) => ({
        productId: item.productId,
        presentationId: item.presentationId,
        purchasedQuantity: item.purchasedQuantity,
        purchasedUnitCost: item.purchasedUnitCost,
        lotCode: item.lotCode || undefined,
        purchaseDate: item.purchaseDate || undefined,
      }));

      const result = await createPurchase({
        supplierName: data.supplierName || undefined,
        paymentType: data.paymentType || undefined,
        notes: data.notes || undefined,
        items: purchaseItems,
      });

      if (!result.success) {
        setServerError(result.error);
        toast.error(result.error);
        return;
      }

      toast.success("¡Compra registrada correctamente!", {
        description: `Total: ${formatMoney(registeredTotal)} ${currency}`,
      });

      // Limpiar formulario después del registro exitoso.
      reset();
      setItems([]);

      setSelectedProductId(null);
      setSelectedPresentationId(null);

      setQuantity("");
      setUnitCost("");
      setLotCode("");
      setPurchaseDate("");
      setServerError("");

      // Actualizar la caja sin convertir un fallo de actualización
      // en un falso error de registro de compra.
      try {
        const cashBoxResult = await getActiveCashBox();

        if (cashBoxResult.success) {
          setCashBox(cashBoxResult.cashBox);
        } else {
          console.error("No se pudo actualizar la caja:", cashBoxResult.error);
        }
      } catch (error) {
        console.error("Error actualizando la caja:", error);
      }

      try {
        onCreated?.();
      } catch (error) {
        console.error("Error ejecutando onCreated:", error);
      }
    } catch (error) {
      console.error("Error creando compra:", error);

      const message = "Ocurrió un error al registrar la compra.";

      setServerError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  // --------------------------------------------------
  // INTERFAZ
  // --------------------------------------------------

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
                    if (
                      value === "EFECTIVO" ||
                      value === "TRANSFERENCIA" ||
                      value === "CREDITO"
                    ) {
                      form.setValue("paymentType", value, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }
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
                Selecciona el producto y registra su presentación de compra.
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
                    className="w-[--radix-popover-trigger-width] p-0"
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
                                      Unidad base: {product.unit}
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

              {/* PRESENTACIÓN */}

              {selectedProduct && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Presentación de compra
                  </label>

                  {selectedProduct.presentations.filter(
                    (presentation) =>
                      presentation.active && presentation.canPurchase,
                  ).length === 0 ? (
                    <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                      Este producto no tiene presentaciones configuradas. Debes
                      crear una presentación para poder comprarlo.
                    </p>
                  ) : (
                    <Select
                      value={selectedPresentationId?.toString() ?? ""}
                      onValueChange={handleSelectPresentation}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una presentación" />
                      </SelectTrigger>

                      <SelectContent>
                        {selectedProduct.presentations
                          .filter(
                            (presentation) =>
                              presentation.active && presentation.canPurchase,
                          )
                          .map((presentation) => (
                            <SelectItem
                              key={presentation.id}
                              value={presentation.id.toString()}
                            >
                              {presentation.name} ({presentation.factor}{" "}
                              {selectedProduct.unit})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

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

              {/* CANTIDAD Y PRECIO */}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label htmlFor="quantity" className="text-sm font-medium">
                    Cantidad comprada
                  </label>

                  <Input
                    id="quantity"
                    type="number"
                    min="0.01"
                    step="any"
                    placeholder="0"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                    disabled={!selectedPresentation}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="unitCost" className="text-sm font-medium">
                    Precio por presentación
                  </label>

                  <Input
                    id="unitCost"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={unitCost}
                    onChange={(event) => setUnitCost(event.target.value)}
                    disabled={!selectedPresentation}
                  />
                </div>
              </div>

              {/* VISTA PREVIA */}

              {selectedPresentation && (
                <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm font-medium">Resumen de conversión</p>

                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">
                      Unidades que entrarán
                    </span>

                    <span className="font-semibold tabular-nums">
                      {formatMoney(previewBaseQuantity)} {selectedProduct?.unit}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">
                      Costo por {selectedProduct?.unit}
                    </span>

                    <span className="font-semibold tabular-nums">
                      {formatMoney(previewBaseUnitCost)}
                    </span>
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex justify-between gap-3">
                      <span className="text-sm font-medium">Subtotal</span>

                      <span className="font-bold tabular-nums">
                        {formatMoney(previewSubtotal)}{" "}
                        {cashBox?.currency ?? "CUP"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="button"
                className="w-full"
                onClick={handleAddItem}
                disabled={!selectedProduct || !selectedPresentation}
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
              {/* TABLA DE LOTES */}

              <div className="overflow-hidden rounded-lg border">
                <div className="max-h-[520px] overflow-auto">
                  <table className="w-full min-w-[1050px] text-sm">
                    <thead className="sticky top-0 z-10 bg-muted">
                      <tr className="border-b">
                        <th className="px-4 py-3 text-left font-medium">
                          Producto / lote
                        </th>

                        <th className="px-4 py-3 text-left font-medium">
                          Presentación
                        </th>

                        <th className="px-4 py-3 text-left font-medium">
                          Fecha
                        </th>

                        <th className="px-4 py-3 text-right font-medium">
                          Comprado
                        </th>

                        <th className="px-4 py-3 text-right font-medium">
                          Recibido
                        </th>

                        <th className="px-4 py-3 text-right font-medium">
                          Costo base
                        </th>

                        <th className="px-4 py-3 text-right font-medium">
                          Subtotal
                        </th>

                        <th className="w-12 px-4 py-3" />
                      </tr>
                    </thead>

                    <tbody>
                      {items.map((item) => {
                        const subtotal =
                          item.purchasedQuantity * item.purchasedUnitCost;

                        return (
                          <tr
                            key={item.lineId}
                            className="border-b last:border-0 hover:bg-muted/40"
                          >
                            <td className="max-w-[200px] px-4 py-3">
                              <p
                                className="truncate font-medium"
                                title={item.productName}
                              >
                                {item.productName}
                              </p>

                              <p className="text-xs text-muted-foreground">
                                Lote: {item.lotCode}
                              </p>
                            </td>

                            <td className="px-4 py-3">
                              <p className="font-medium">
                                {item.presentationName}
                              </p>

                              <p className="text-xs text-muted-foreground">
                                × {item.presentationFactor}
                              </p>
                            </td>

                            <td className="whitespace-nowrap px-4 py-3">
                              {item.purchaseDate}
                            </td>

                            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                              {formatMoney(item.purchasedQuantity)}
                            </td>

                            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                              <p className="font-medium">
                                {formatMoney(item.baseQuantity)}
                              </p>

                              <p className="text-xs text-muted-foreground">
                                {item.baseUnit}
                              </p>
                            </td>

                            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                              {formatMoney(item.baseUnitCost)}
                            </td>

                            <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums">
                              {formatMoney(subtotal)}
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
                  {formatMoney(total)} {cashBox?.currency ?? "CUP"}
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
                      {formatMoney(remainingCapital)} {cashBox.currency}
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
                    {formatMoney(cashBox.currentBalance)} {cashBox.currency}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Total compra
                  </span>

                  <span className="font-medium tabular-nums">
                    {formatMoney(total)} {cashBox.currency}
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
                    {formatMoney(remainingCapital)} {cashBox.currency}
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
