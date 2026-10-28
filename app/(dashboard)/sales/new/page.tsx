"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react";

import { saleSchema, type SaleFormData } from "@/schema/sale.schema";
import { createSale } from "@/action/sale.action";
import { getProducts } from "@/action/product.action";

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

type Product = {
  id: number;
  name: string;
  barcode: string | null;
  price: number;
  stock: number;
  active: boolean;
  lotCode: string | null;
  purchaseDate: Date | string | null;
};

type SaleItem = {
  productId: number;
  name: string;
  lotCode: string | null;
  purchaseDate: Date | string | null;
  quantity: number;
  unitPrice: number;
  stock: number;
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

  return date.toLocaleDateString("es");
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

  // Carga inicial: el estado se actualiza después de la petición.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await getProducts();

        if (cancelled) return;

        if (result.success) {
          setProducts(
            result.products.filter(
              (product) => product.active && product.stock > 0,
            ) as Product[],
          );
        } else {
          toast.error("No se pudieron cargar los productos.");
        }
      } catch {
        if (!cancelled) {
          toast.error("Ocurrió un error al cargar los productos.");
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

  // Mantiene el estado visual y los datos del formulario sincronizados.
  function updateSaleItems(nextItems: SaleItem[]) {
    setItems(nextItems);

    setValue(
      "items",
      nextItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      {
        shouldValidate: true,
        shouldDirty: true,
      },
    );
  }

  async function refreshProducts() {
    try {
      const result = await getProducts();

      if (result.success) {
        setProducts(
          result.products.filter(
            (product) => product.active && product.stock > 0,
          ) as Product[],
        );
      }
    } catch {
      toast.error("No se pudo actualizar el inventario.");
    }
  }

  function addProduct() {
    const product = products.find(
      (item) => String(item.id) === selectedProductId,
    );

    if (!product) {
      toast.error("Selecciona un lote para añadirlo a la venta.");
      return;
    }

    const existing = items.find((item) => item.productId === product.id);

    if (existing) {
      if (existing.quantity >= existing.stock) {
        toast.warning("No hay más unidades disponibles de este lote.");
        return;
      }

      updateSaleItems(
        items.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      updateSaleItems([
        ...items,
        {
          productId: product.id,
          name: product.name,
          lotCode: product.lotCode,
          purchaseDate: product.purchaseDate,
          quantity: 1,
          unitPrice: product.price,
          stock: product.stock,
        },
      ]);
    }

    setSelectedProductId("");
  }

  function changeQuantity(productId: number, amount: number) {
    const current = items.find((item) => item.productId === productId);

    if (!current) return;

    const quantity = current.quantity + amount;

    if (quantity < 1) {
      updateSaleItems(items.filter((item) => item.productId !== productId));
      return;
    }

    if (quantity > current.stock) {
      toast.warning("La cantidad supera el stock disponible del lote.");
      return;
    }

    updateSaleItems(
      items.map((item) =>
        item.productId === productId ? { ...item, quantity } : item,
      ),
    );
  }

  function setItemQuantity(productId: number, value: string) {
    const current = items.find((item) => item.productId === productId);

    if (!current) return;

    // Permite dejar el campo vacío mientras se escribe.
    if (value === "") {
      updateSaleItems(
        items.map((item) =>
          item.productId === productId ? { ...item, quantity: 0 } : item,
        ),
      );
      return;
    }

    const quantity = Number(value);

    if (!Number.isInteger(quantity) || quantity < 1) return;

    if (quantity > current.stock) {
      toast.warning("La cantidad supera el stock disponible del lote.");
      return;
    }

    updateSaleItems(
      items.map((item) =>
        item.productId === productId ? { ...item, quantity } : item,
      ),
    );
  }

  function normalizeQuantity(productId: number) {
    updateSaleItems(
      items.map((item) =>
        item.productId === productId && item.quantity < 1
          ? { ...item, quantity: 1 }
          : item,
      ),
    );
  }

  function removeItem(productId: number) {
    updateSaleItems(items.filter((item) => item.productId !== productId));
  }

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [items],
  );

  async function onSubmit(data: SaleFormData) {
    if (items.length === 0) {
      toast.error("Añade al menos un lote a la venta.");
      return;
    }

    if (items.some((item) => item.quantity < 1)) {
      toast.error("Todas las cantidades deben ser mayores que cero.");
      return;
    }

    setSaving(true);

    try {
      const result = await createSale({
        paymentType: data.paymentType,
        items: data.items,
      });

      if (!result.success) {
        toast.error(
          "No se pudo registrar la venta. Comprueba el stock e inténtalo de nuevo.",
        );
        return;
      }

      toast.success("Venta registrada correctamente.");

      updateSaleItems([]);
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

  return (
    <div className="mx-auto max-w-5xl space-y-6 ">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" asChild>
          <Link href="/sales" aria-label="Volver a ventas">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>

        <div>
          <h1 className="text-2xl font-bold">Nueva venta</h1>
          <p className="text-sm text-muted-foreground">
            Selecciona los lotes y las cantidades que deseas vender.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Forma de pago</CardTitle>
            <CardDescription>
              Selecciona cómo se realizará el pago.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-2">
            <Select
              value={paymentType}
              onValueChange={(value) =>
                setValue("paymentType", value as SaleFormData["paymentType"], {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar forma de pago" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                <SelectItem value="CREDIT">Crédito</SelectItem>
              </SelectContent>
            </Select>

            {errors.paymentType && (
              <p className="text-sm text-destructive">
                {errors.paymentType.message}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Añadir productos</CardTitle>
            <CardDescription>
              Cada opción representa un lote específico del inventario.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="min-w-0 flex-1">
                <Select
                  value={selectedProductId}
                  onValueChange={setSelectedProductId}
                  disabled={loadingProducts || products.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingProducts
                          ? "Cargando productos..."
                          : products.length === 0
                            ? "No hay lotes disponibles"
                            : "Seleccionar producto o lote"
                      }
                    />
                  </SelectTrigger>

                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={String(product.id)}>
                        {product.name}
                        {" · "}
                        Lote {product.lotCode || `#${product.id}`}
                        {" · "}
                        Stock: {product.stock}
                        {" · "}
                        {currency.format(product.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="button"
                onClick={addProduct}
                disabled={!selectedProductId || loadingProducts}
              >
                <Plus className="mr-2 h-4 w-4" />
                Añadir lote
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Productos de la venta</CardTitle>
            <CardDescription>
              Ajusta la cantidad y el precio de cada lote.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {items.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                Todavía no has añadido ningún lote.
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.productId} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Lote: {item.lotCode || `#${item.productId}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Compra: {formatDate(item.purchaseDate)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Stock disponible: {item.stock}
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.productId)}
                        aria-label={`Eliminar ${item.name}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                      <div className="space-y-2">
                        <label
                          htmlFor={`quantity-${item.productId}`}
                          className="text-sm font-medium"
                        >
                          Cantidad
                        </label>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => changeQuantity(item.productId, -1)}
                            aria-label="Disminuir cantidad"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>

                          <Input
                            id={`quantity-${item.productId}`}
                            type="number"
                            min={1}
                            max={item.stock}
                            step={1}
                            value={item.quantity === 0 ? "" : item.quantity}
                            className="h-9 w-24 text-center"
                            onChange={(event) =>
                              setItemQuantity(
                                item.productId,
                                event.target.value,
                              )
                            }
                            onBlur={() => normalizeQuantity(item.productId)}
                          />

                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            disabled={item.quantity >= item.stock}
                            onClick={() => changeQuantity(item.productId, 1)}
                            aria-label="Aumentar cantidad"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor={`price-${item.productId}`}
                          className="text-sm font-medium"
                        >
                          Precio unitario
                        </label>

                        <Input
                          id={`price-${item.productId}`}
                          type="number"
                          min={0.01}
                          step="0.01"
                          value={item.unitPrice}
                          className="w-36"
                          onChange={(event) => {
                            const value = Number(event.target.value);

                            if (!Number.isFinite(value) || value <= 0) return;

                            updateSaleItems(
                              items.map((current) =>
                                current.productId === item.productId
                                  ? { ...current, unitPrice: value }
                                  : current,
                              ),
                            );
                          }}
                        />
                      </div>

                      <div className="min-w-28 text-right">
                        <p className="text-xs text-muted-foreground">
                          Subtotal
                        </p>
                        <p className="font-semibold">
                          {currency.format(item.quantity * item.unitPrice)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {errors.items && (
              <p className="text-sm text-destructive">{errors.items.message}</p>
            )}

            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-lg font-semibold">Total de la venta</span>
              <span className="text-2xl font-bold">
                {currency.format(total)}
              </span>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={
                saving ||
                loadingProducts ||
                items.length === 0 ||
                items.some(
                  (item) =>
                    item.quantity < 1 ||
                    item.quantity > item.stock ||
                    item.unitPrice <= 0,
                )
              }
            >
              {saving ? "Registrando venta..." : "Registrar venta"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
