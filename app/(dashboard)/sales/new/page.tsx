"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";

import {
  ArrowLeft,
  Plus,
  Trash2,
  Package,
  ShoppingCart,
  Layers3,
  Receipt,
  TrendingUp,
  Wallet,
  Minus,
} from "lucide-react";

import { saleSchema, type SaleFormData } from "@/schema/sale.schema";
import { createSale } from "@/action/sale.action";
import { getProductsForSale } from "@/action/product.action";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type ProductLot = {
  id: number;
  lotCode: string | null;
  purchaseDate: Date | string;
  availableQuantity: number;
  unitCost: number;
};

type Product = {
  id: number;
  name: string;
  barcode: string | null;
  price: number;
  stock: number;
  unit: string;
  lots: ProductLot[];
};

type LotSelection = {
  lotId: number | null;
  quantity: number;
};

type SaleItem = {
  productId: number;
  name: string;
  unit: string;
  unitPrice: number;
  stock: number;
  allocations: LotSelection[];
};

const currency = new Intl.NumberFormat("es", {
  style: "currency",
  currency: "CUP",
  maximumFractionDigits: 2,
});

function formatDate(value: Date | string | null) {
  if (!value) return "Sin fecha";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);
}

export default function NewSalePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      paymentType: "EFECTIVO",
      items: [],
    },
  });

  const paymentType = useWatch({
    control,
    name: "paymentType",
  });

  // ----------------------------------------------------------
  // CARGAR PRODUCTOS Y LOTES
  // ----------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await getProductsForSale();

        if (cancelled) return;

        if (result.success) {
          setProducts(result.products);
        } else {
          toast.error(result.error);
        }
      } catch {
        if (!cancelled) {
          toast.error("No se pudieron cargar los productos.");
        }
      } finally {
        if (!cancelled) {
          setLoadingProducts(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  // ----------------------------------------------------------
  // SINCRONIZAR CON REACT HOOK FORM
  // ----------------------------------------------------------

  function getItemQuantity(item: SaleItem) {
    return item.allocations.reduce(
      (total, allocation) =>
        total + (allocation.lotId !== null ? allocation.quantity : 0),
      0,
    );
  }

  function updateSaleItems(nextItems: SaleItem[]) {
    setItems(nextItems);

    setValue(
      "items",
      nextItems.map((item) => ({
        productId: item.productId,
        quantity: getItemQuantity(item),
        unitPrice: item.unitPrice,
      })),
      {
        shouldValidate: true,
        shouldDirty: true,
      },
    );
  }

  // ----------------------------------------------------------
  // ACTUALIZAR INVENTARIO
  // ----------------------------------------------------------

  async function refreshProducts() {
    try {
      const result = await getProductsForSale();

      if (result.success) {
        setProducts(result.products);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("No se pudo actualizar el inventario.");
    }
  }

  function getAvailableStock(product: Product) {
    return product.lots.reduce(
      (total, lot) => total + lot.availableQuantity,
      0,
    );
  }

  function getProductLot(productId: number, lotId: number) {
    const product = products.find((item) => item.id === productId);

    return product?.lots.find((lot) => lot.id === lotId);
  }

  // ----------------------------------------------------------
  // AÑADIR PRODUCTO
  // ----------------------------------------------------------

  function addProduct() {
    const product = products.find(
      (item) => String(item.id) === selectedProductId,
    );

    if (!product) {
      toast.error("Selecciona un producto.");
      return;
    }

    if (items.some((item) => item.productId === product.id)) {
      toast.warning("Este producto ya está en la venta.");
      return;
    }

    const availableStock = getAvailableStock(product);

    if (availableStock <= 0) {
      toast.warning("Este producto no tiene lotes disponibles.");
      return;
    }

    updateSaleItems([
      ...items,
      {
        productId: product.id,
        name: product.name,
        unit: product.unit,
        unitPrice: product.price,
        stock: availableStock,
        allocations: [
          {
            lotId: null,
            quantity: 1,
          },
        ],
      },
    ]);

    setSelectedProductId("");
  }

  // ----------------------------------------------------------
  // AÑADIR UNA FILA DE LOTE
  // ----------------------------------------------------------

  function addLotRow(productId: number) {
    updateSaleItems(
      items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              allocations: [
                ...item.allocations,
                {
                  lotId: null,
                  quantity: 1,
                },
              ],
            }
          : item,
      ),
    );
  }

  // ----------------------------------------------------------
  // SELECCIONAR LOTE
  // ----------------------------------------------------------

  function selectLot(productId: number, index: number, value: string) {
    const lotId = Number(value);

    const current = items.find((item) => item.productId === productId);

    if (!current) return;

    const alreadySelected = current.allocations.some(
      (allocation, allocationIndex) =>
        allocationIndex !== index && allocation.lotId === lotId,
    );

    if (alreadySelected) {
      toast.warning("Ese lote ya está seleccionado.");
      return;
    }

    const productLot = getProductLot(productId, lotId);

    if (!productLot) {
      toast.error("El lote seleccionado no existe.");
      return;
    }

    updateSaleItems(
      items.map((item) => {
        if (item.productId !== productId) return item;

        return {
          ...item,
          allocations: item.allocations.map((allocation, allocationIndex) =>
            allocationIndex === index
              ? {
                  lotId,
                  quantity: Math.min(
                    allocation.quantity,
                    productLot.availableQuantity,
                  ),
                }
              : allocation,
          ),
        };
      }),
    );
  }

  // ----------------------------------------------------------
  // MODIFICAR CANTIDAD DE UN LOTE
  // ----------------------------------------------------------

  function changeLotQuantity(productId: number, index: number, value: string) {
    const quantity = Number(value);

    if (value === "" || !Number.isInteger(quantity) || quantity < 1) {
      return;
    }

    const current = items.find((item) => item.productId === productId);

    if (!current) return;

    const allocation = current.allocations[index];

    if (!allocation || allocation.lotId === null) return;

    const lot = getProductLot(productId, allocation.lotId);

    if (!lot) return;

    const quantityUsedElsewhere = current.allocations.reduce(
      (total, other, otherIndex) => {
        if (otherIndex !== index && other.lotId === allocation.lotId) {
          return total + other.quantity;
        }

        return total;
      },
      0,
    );

    const maxQuantity = lot.availableQuantity - quantityUsedElsewhere;

    if (quantity > maxQuantity) {
      toast.warning(
        `Solo hay ${maxQuantity} unidades disponibles en este lote.`,
      );
      return;
    }

    updateSaleItems(
      items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              allocations: item.allocations.map(
                (currentAllocation, allocationIndex) =>
                  allocationIndex === index
                    ? {
                        ...currentAllocation,
                        quantity,
                      }
                    : currentAllocation,
              ),
            }
          : item,
      ),
    );
  }

  // ----------------------------------------------------------
  // ELIMINAR LOTE
  // ----------------------------------------------------------

  function removeLotRow(productId: number, index: number) {
    updateSaleItems(
      items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              allocations: item.allocations.filter(
                (_, allocationIndex) => allocationIndex !== index,
              ),
            }
          : item,
      ),
    );
  }

  // ----------------------------------------------------------
  // CAMBIAR PRECIO DE VENTA
  // ----------------------------------------------------------

  function changePrice(productId: number, value: string) {
    const price = Number(value);

    if (value === "" || !Number.isFinite(price) || price <= 0) {
      return;
    }

    updateSaleItems(
      items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              unitPrice: price,
            }
          : item,
      ),
    );
  }

  // ----------------------------------------------------------
  // ELIMINAR PRODUCTO
  // ----------------------------------------------------------

  function removeItem(productId: number) {
    updateSaleItems(items.filter((item) => item.productId !== productId));
  }

  // ----------------------------------------------------------
  // CÁLCULOS DE VENTA
  // ----------------------------------------------------------

  function getItemCost(item: SaleItem) {
    return item.allocations.reduce((total, allocation) => {
      if (allocation.lotId === null) return total;

      const lot = getProductLot(item.productId, allocation.lotId);

      if (!lot) return total;

      return total + lot.unitCost * allocation.quantity;
    }, 0);
  }

  const summary = useMemo(() => {
    let quantity = 0;
    let cost = 0;
    let total = 0;

    for (const item of items) {
      const itemQuantity = getItemQuantity(item);

      quantity += itemQuantity;
      cost += getItemCost(item);
      total += itemQuantity * item.unitPrice;
    }

    return {
      quantity,
      cost,
      total,
      profit: total - cost,
    };
  }, [items, products]);

  // ----------------------------------------------------------
  // VALIDAR ANTES DE VENDER
  // ----------------------------------------------------------

  function validateSale() {
    if (items.length === 0) {
      toast.error("Añade al menos un producto.");
      return false;
    }

    for (const item of items) {
      const quantity = getItemQuantity(item);

      if (quantity <= 0) {
        toast.error(`Selecciona un lote para ${item.name}.`);
        return false;
      }

      if (item.allocations.some((allocation) => allocation.lotId === null)) {
        toast.error(`Completa la selección de lotes de ${item.name}.`);
        return false;
      }

      if (
        item.allocations.reduce(
          (sum, allocation) => sum + allocation.quantity,
          0,
        ) !== quantity
      ) {
        toast.error(`Revisa las cantidades de ${item.name}.`);
        return false;
      }

      if (quantity > item.stock) {
        toast.error(`No hay suficiente stock de ${item.name}.`);
        return false;
      }
    }

    return true;
  }

  // ----------------------------------------------------------
  // REGISTRAR VENTA
  // ----------------------------------------------------------

  async function onSubmit(data: SaleFormData) {
    if (!validateSale()) return;

    setSaving(true);

    try {
      const result = await createSale({
        paymentType: data.paymentType,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: getItemQuantity(item),
          unitPrice: item.unitPrice,
          lotAllocations: item.allocations.map((allocation) => ({
            lotId: allocation.lotId!,
            quantity: allocation.quantity,
          })),
        })),
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Venta registrada correctamente.");

      setItems([]);

      reset({
        paymentType: "EFECTIVO",
        items: [],
      });

      setSelectedProductId("");

      await refreshProducts();
    } catch {
      toast.error("Ocurrió un error al registrar la venta.");
    } finally {
      setSaving(false);
    }
  }

  // ----------------------------------------------------------
  // ESTADOS DE BOTONES
  // ----------------------------------------------------------

  const productSelectDisabled = Boolean(
    loadingProducts || products.length === 0,
  );

  const addButtonDisabled = Boolean(!selectedProductId || loadingProducts);

  const submitDisabled = Boolean(
    saving ||
    loadingProducts ||
    items.length === 0 ||
    items.some(
      (item) =>
        getItemQuantity(item) <= 0 ||
        item.allocations.some((allocation) => allocation.lotId === null) ||
        item.unitPrice <= 0,
    ),
  );

  // ----------------------------------------------------------
  // INTERFAZ
  // ----------------------------------------------------------

  return (
    <div className="mx-auto max-w-6xl space-y-7 pb-10">
      {/* ENCABEZADO */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/sales" aria-label="Volver a ventas">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Nueva venta</h1>
              <Badge variant="secondary">Inventario por lotes</Badge>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Selecciona exactamente de qué lotes salen tus productos.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* FORMA DE PAGO */}

        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Wallet className="h-5 w-5" />
              </div>

              <div>
                <CardTitle className="text-base">Forma de pago</CardTitle>
                <CardDescription>
                  Selecciona cómo se cobrará esta venta.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Select
              value={paymentType}
              disabled={false}
              onValueChange={(value) =>
                setValue("paymentType", value as SaleFormData["paymentType"], {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
            >
              <SelectTrigger className="max-w-sm">
                <SelectValue placeholder="Seleccionar forma de pago" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                <SelectItem value="CREDITO">Crédito</SelectItem>
              </SelectContent>
            </Select>

            {errors.paymentType && (
              <p className="mt-2 text-sm text-destructive">
                {errors.paymentType.message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* SELECTOR DE PRODUCTOS */}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Package className="h-5 w-5" />
              </div>

              <div>
                <CardTitle className="text-base">Añadir productos</CardTitle>
                <CardDescription>
                  Busca un producto para incorporarlo a la venta.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="min-w-0 flex-1">
                <Select
                  value={selectedProductId}
                  onValueChange={setSelectedProductId}
                  disabled={productSelectDisabled || undefined}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue
                      placeholder={
                        loadingProducts
                          ? "Cargando productos..."
                          : products.length === 0
                            ? "No hay productos disponibles"
                            : "Seleccionar producto..."
                      }
                    />
                  </SelectTrigger>

                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={String(product.id)}>
                        {product.name} — {getAvailableStock(product)}{" "}
                        {product.unit} disponibles
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="button"
                onClick={addProduct}
                disabled={addButtonDisabled || undefined}
                className="h-11"
              >
                <Plus className="mr-2 h-4 w-4" />
                Añadir producto
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* CARRITO */}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <ShoppingCart className="h-5 w-5" />
                </div>

                <div>
                  <CardTitle className="text-base">
                    Detalle de la venta
                  </CardTitle>
                  <CardDescription>
                    Configura los lotes y cantidades de cada producto.
                  </CardDescription>
                </div>
              </div>

              <Badge variant="outline">
                {items.length} {items.length === 1 ? "producto" : "productos"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-5 py-12 text-center">
                <div className="mb-4 rounded-full bg-muted p-4">
                  <ShoppingCart className="h-7 w-7 text-muted-foreground" />
                </div>

                <h3 className="font-semibold">Tu venta está vacía</h3>

                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Añade productos para comenzar a seleccionar los lotes que
                  utilizarás.
                </p>
              </div>
            ) : (
              items.map((item) => {
                const quantity = getItemQuantity(item);
                const cost = getItemCost(item);
                const subtotal = quantity * item.unitPrice;
                const profit = subtotal - cost;

                return (
                  <div
                    key={item.productId}
                    className="overflow-hidden rounded-xl border bg-card"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/30 p-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="rounded-lg border bg-background p-2">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate font-semibold">
                            {item.name}
                          </h3>

                          <p className="text-xs text-muted-foreground">
                            Stock disponible: {item.stock} {item.unit}
                          </p>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.productId)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </Button>
                    </div>

                    <div className="space-y-5 p-4">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <h4 className="flex items-center gap-2 text-sm font-semibold">
                              <Layers3 className="h-4 w-4 text-primary" />
                              Lotes seleccionados
                            </h4>

                            <p className="mt-1 text-xs text-muted-foreground">
                              Elige el lote y la cantidad que vas a vender.
                            </p>
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addLotRow(item.productId)}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Añadir lote
                          </Button>
                        </div>

                        {item.allocations.length === 0 ? (
                          <div className="rounded-lg border border-dashed p-5 text-center">
                            <p className="text-sm text-muted-foreground">
                              Todavía no has seleccionado ningún lote.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {item.allocations.map((allocation, index) => {
                              const selectedLot =
                                allocation.lotId !== null
                                  ? getProductLot(
                                      item.productId,
                                      allocation.lotId,
                                    )
                                  : undefined;

                              const usedElsewhere =
                                allocation.lotId !== null
                                  ? item.allocations.reduce(
                                      (sum, other, otherIndex) =>
                                        otherIndex !== index &&
                                        other.lotId === allocation.lotId
                                          ? sum + other.quantity
                                          : sum,
                                      0,
                                    )
                                  : 0;

                              const maxQuantity = selectedLot
                                ? selectedLot.availableQuantity - usedElsewhere
                                : 0;

                              return (
                                <div
                                  key={`${item.productId}-${index}`}
                                  className="grid gap-3 rounded-lg border bg-muted/10 p-3 sm:grid-cols-[minmax(0,1fr)_120px_40px] sm:items-end"
                                >
                                  <div className="min-w-0 space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">
                                      Lote
                                    </label>

                                    <Select
                                      value={
                                        allocation.lotId === null
                                          ? ""
                                          : String(allocation.lotId)
                                      }
                                      onValueChange={(value) =>
                                        selectLot(item.productId, index, value)
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar lote..." />
                                      </SelectTrigger>

                                      <SelectContent>
                                        {products
                                          .find(
                                            (product) =>
                                              product.id === item.productId,
                                          )
                                          ?.lots.filter(
                                            (lot) =>
                                              !item.allocations.some(
                                                (other, otherIndex) =>
                                                  otherIndex !== index &&
                                                  other.lotId === lot.id,
                                              ),
                                          )
                                          .map((lot) => (
                                            <SelectItem
                                              key={lot.id}
                                              value={String(lot.id)}
                                            >
                                              {lot.lotCode || `Lote #${lot.id}`}
                                              {" · "}
                                              {lot.availableQuantity}{" "}
                                              disponibles
                                              {" · "}
                                              {currency.format(lot.unitCost)}
                                            </SelectItem>
                                          ))}
                                      </SelectContent>
                                    </Select>

                                    {selectedLot && (
                                      <p className="text-xs text-muted-foreground">
                                        Compra:{" "}
                                        {formatDate(selectedLot.purchaseDate)}
                                        {" · "}
                                        Costo unitario:{" "}
                                        {currency.format(selectedLot.unitCost)}
                                      </p>
                                    )}
                                  </div>

                                  <div className="space-y-2">
                                    <label
                                      htmlFor={`lot-quantity-${item.productId}-${index}`}
                                      className="text-xs font-medium text-muted-foreground"
                                    >
                                      Cantidad
                                    </label>

                                    <Input
                                      id={`lot-quantity-${item.productId}-${index}`}
                                      type="number"
                                      min={1}
                                      max={maxQuantity || undefined}
                                      step={1}
                                      disabled={!selectedLot || undefined}
                                      value={
                                        allocation.quantity === 0
                                          ? ""
                                          : allocation.quantity
                                      }
                                      onChange={(event) =>
                                        changeLotQuantity(
                                          item.productId,
                                          index,
                                          event.target.value,
                                        )
                                      }
                                    />
                                  </div>

                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    disabled={
                                      (item.allocations.length === 1 &&
                                        allocation.lotId === null) ||
                                      undefined
                                    }
                                    onClick={() =>
                                      removeLotRow(item.productId, index)
                                    }
                                    aria-label="Eliminar lote"
                                  >
                                    <Minus className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <Separator />

                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-2">
                          <label
                            htmlFor={`price-${item.productId}`}
                            className="text-xs font-medium text-muted-foreground"
                          >
                            Precio de venta por unidad
                          </label>

                          <Input
                            id={`price-${item.productId}`}
                            type="number"
                            min={0.01}
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(event) =>
                              changePrice(item.productId, event.target.value)
                            }
                          />
                        </div>

                        <div className="rounded-lg bg-muted/40 p-3">
                          <p className="text-xs text-muted-foreground">
                            Cantidad total
                          </p>

                          <p className="mt-1 text-lg font-semibold">
                            {quantity} {item.unit}
                          </p>
                        </div>

                        <div className="rounded-lg bg-muted/40 p-3">
                          <p className="text-xs text-muted-foreground">
                            Costo de adquisición
                          </p>

                          <p className="mt-1 text-lg font-semibold">
                            {currency.format(cost)}
                          </p>
                        </div>

                        <div className="rounded-lg bg-muted/40 p-3">
                          <p className="text-xs text-muted-foreground">
                            Subtotal de venta
                          </p>

                          <p className="mt-1 text-lg font-semibold">
                            {currency.format(subtotal)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed px-3 py-2">
                        <span className="text-sm text-muted-foreground">
                          Ganancia estimada de este producto
                        </span>

                        <span
                          className={`font-semibold ${
                            profit < 0
                              ? "text-destructive"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {currency.format(profit)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* RESUMEN GENERAL */}

        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Receipt className="h-5 w-5" />
              </div>

              <div>
                <CardTitle className="text-base">Resumen de la venta</CardTitle>
                <CardDescription>
                  Revisa los importes antes de confirmar.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span className="text-sm">Unidades</span>
                </div>

                <p className="mt-2 text-2xl font-bold">{summary.quantity}</p>
              </div>

              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Layers3 className="h-4 w-4" />
                  <span className="text-sm">Costo total</span>
                </div>

                <p className="mt-2 text-2xl font-bold">
                  {currency.format(summary.cost)}
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm">Ganancia estimada</span>
                </div>

                <p
                  className={`mt-2 text-2xl font-bold ${
                    summary.profit < 0
                      ? "text-destructive"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {currency.format(summary.profit)}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Total a cobrar</p>

                <p className="text-3xl font-bold tracking-tight">
                  {currency.format(summary.total)}
                </p>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={submitDisabled || undefined}
                className="min-w-48"
              >
                {saving ? (
                  "Registrando..."
                ) : (
                  <>
                    <Receipt className="mr-2 h-4 w-4" />
                    Registrar venta
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
