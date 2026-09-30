"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";

import { saleSchema, type SaleFormData } from "@/schema/sale.schema";

import { createSale } from "@/action/sale.action";
import { getProducts } from "@/action/product.action";

import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  CreditCard,
  Package,
  Banknote,
} from "lucide-react";

type Product = {
  id: number;
  name: string;
  barcode: string | null;
  price: number;
  stock: number;
  active: boolean;
};

type SaleItem = {
  productId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  stock: number;
};

export default function NewSalePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    setValue,
    handleSubmit,
    control,
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
  // -----------------------------------------
  // Cargar productos
  // -----------------------------------------

  useEffect(() => {
    async function loadProducts() {
      setLoadingProducts(true);

      const result = await getProducts();

      if (result.success) {
        setProducts(
          result.products.filter(
            (product) => product.active && product.stock > 0,
          ),
        );
      } else {
        console.log(result.error);
      }

      setLoadingProducts(false);
    }

    loadProducts();
  }, []);

  // -----------------------------------------
  // Sincronizar items con React Hook Form
  // -----------------------------------------

  useEffect(() => {
    setValue(
      "items",
      items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      {
        shouldValidate: true,
      },
    );
  }, [items, setValue]);

  // -----------------------------------------
  // Total
  // -----------------------------------------

  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }, [items]);

  // -----------------------------------------
  // Agregar producto
  // -----------------------------------------

  function addProduct() {
    if (!selectedProductId) {
      console.log("Selecciona un producto.");
      toast.warning("Selecciona un producto", { position: "top-center" });
      return;
    }

    const productId = Number(selectedProductId);

    const product = products.find((product) => product.id === productId);

    if (!product) {
      console.log("Producto no encontrado.");
      return;
    }

    const existingItem = items.find((item) => item.productId === product.id);

    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        console.log("No puedes superar el stock disponible.");
        toast.warning("No puedes superar el stock disponible.", {
          position: "top-center",
        });
        return;
      }

      setItems((current) =>
        current.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item,
        ),
      );

      return;
    }

    setItems((current) => [
      ...current,
      {
        productId: product.id,
        name: product.name,
        quantity: 1,
        unitPrice: product.price,
        stock: product.stock,
      },
    ]);

    setSelectedProductId("");
  }

  // -----------------------------------------
  // Cambiar cantidad
  // -----------------------------------------

  function changeQuantity(productId: number, amount: number) {
    setItems((current) =>
      current
        .map((item) => {
          if (item.productId !== productId) {
            return item;
          }

          const newQuantity = item.quantity + amount;

          if (newQuantity <= 0) {
            return null;
          }

          if (newQuantity > item.stock) {
            console.log("No hay suficiente stock.");
            toast.warning("No hay suficiente stock.", {
              position: "top-center",
            });
            return item;
          }

          return {
            ...item,
            quantity: newQuantity,
          };
        })
        .filter((item): item is SaleItem => item !== null),
    );
  }

  // -----------------------------------------
  // Eliminar producto
  // -----------------------------------------

  function removeItem(productId: number) {
    setItems((current) =>
      current.filter((item) => item.productId !== productId),
    );
  }

  // -----------------------------------------
  // Registrar venta
  // -----------------------------------------

  async function onSubmit(data: SaleFormData) {
    if (items.length === 0) {
      console.log("Agrega al menos un producto.");
      toast.warning("Agrega al menos un producto", { position: "top-center" });
      return;
    }

    setSaving(true);

    const result = await createSale({
      paymentType: data.paymentType,
      items: data.items,
    });

    if (!result.success) {
      console.log(result.error);
      setSaving(false);
      return;
    }

    console.log(`Venta #${result.sale.id} registrada correctamente.`);
    toast.success(`Venta #${result.sale.id} registrada correctamente.`, {
      position: "top-center",
    });
    setItems([]);
    setSelectedProductId("");
    setSaving(false);

    const productsResult = await getProducts();

    if (productsResult.success) {
      setProducts(
        productsResult.products.filter(
          (product) => product.active && product.stock > 0,
        ),
      );
    }
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-6">
      {/* Header */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Link
              href="/sales"
              className="transition-colors hover:text-foreground"
            >
              Ventas
            </Link>

            <span>/</span>

            <span>Nueva venta</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight">Registrar venta</h1>

          <p className="text-muted-foreground">
            Selecciona los productos y completa la venta.
          </p>
        </div>

        <Button variant="outline" asChild>
          <Link href="/sales">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
      </div>

      {/* Formulario completo */}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="overflow-hidden">
          {/* Header de la Card */}

          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Nueva venta
              </CardTitle>

              <span className="text-sm text-muted-foreground">
                {items.length} producto(s)
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-8 p-6">
            {/* -------------------------------- */}
            {/* Método de pago */}
            {/* -------------------------------- */}

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />

                <h2 className="font-semibold">Método de pago</h2>
              </div>

              <div className="max-w-md">
                <Select
                  value={paymentType}
                  onValueChange={(value) =>
                    setValue(
                      "paymentType",
                      value as SaleFormData["paymentType"],
                      {
                        shouldValidate: true,
                      },
                    )
                  }
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Selecciona un método" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="EFECTIVO">Efectivo</SelectItem>

                    <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>

                    <SelectItem value="CREDITO">Crédito</SelectItem>
                  </SelectContent>
                </Select>

                {errors.paymentType && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.paymentType.message}
                  </p>
                )}
              </div>

              {paymentType === "CREDITO" && (
                <div className="rounded-lg border bg-muted/40 p-4">
                  <p className="font-medium">Venta a crédito</p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    El stock será descontado, pero el capital no aumentará. Se
                    generará una deuda para el cliente.
                  </p>
                </div>
              )}
            </div>

            {/* Separador */}

            <div className="border-t" />

            {/* -------------------------------- */}
            {/* Agregar productos */}
            {/* -------------------------------- */}

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />

                <h2 className="font-semibold">Agregar productos</h2>
              </div>

              <div className="flex gap-2">
                <Select
                  value={selectedProductId}
                  onValueChange={setSelectedProductId}
                  disabled={loadingProducts}
                >
                  <SelectTrigger className="h-11 flex-1">
                    <SelectValue
                      placeholder={
                        loadingProducts
                          ? "Cargando productos..."
                          : "Selecciona un producto"
                      }
                    />
                  </SelectTrigger>

                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={String(product.id)}>
                        <div className="flex items-center justify-between gap-4">
                          <span>{product.name}</span>

                          <span className="text-muted-foreground">
                            Stock: {product.stock}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  onClick={addProduct}
                  disabled={loadingProducts}
                  size="icon"
                  className="h-11 w-11 shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* -------------------------------- */}
            {/* Productos */}
            {/* -------------------------------- */}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Productos de la venta</h2>

                <span className="text-sm text-muted-foreground">
                  {items.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                  unidad(es)
                </span>
              </div>

              {items.length === 0 ? (
                <div className="flex min-h-55 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 text-center">
                  <ShoppingCart className="mb-3 h-10 w-10 text-muted-foreground" />

                  <p className="font-medium">No hay productos</p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Selecciona un producto arriba para agregarlo a la venta.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border">
                  {/* Cabecera */}

                  <div className="hidden grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 border-b bg-muted/40 px-4 py-3 text-sm font-medium text-muted-foreground md:grid">
                    <span>Producto</span>
                    <span>Cantidad</span>
                    <span>Precio</span>
                    <span className="text-right">Subtotal</span>
                    <span />
                  </div>

                  {/* Items */}

                  <div className="divide-y">
                    {items.map((item) => (
                      <div
                        key={item.productId}
                        className="grid gap-4 p-4 md:grid-cols-[1fr_auto_auto_auto_auto] md:items-center"
                      >
                        {/* Producto */}

                        <div className="min-w-0">
                          <p className="truncate font-medium">{item.name}</p>

                          <p className="text-sm text-muted-foreground">
                            Stock disponible: {item.stock}
                          </p>
                        </div>

                        {/* Cantidad */}

                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => changeQuantity(item.productId, -1)}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </Button>

                          <span className="w-9 text-center font-medium">
                            {item.quantity}
                          </span>

                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => changeQuantity(item.productId, 1)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {/* Precio */}

                        <div className="text-sm">
                          <span className="text-muted-foreground md:hidden">
                            Precio:{" "}
                          </span>
                          {item.unitPrice.toLocaleString("es-CU")} CUP
                        </div>

                        {/* Subtotal */}

                        <div className="font-semibold md:text-right">
                          <span className="mr-2 text-sm font-normal text-muted-foreground md:hidden">
                            Subtotal:
                          </span>
                          {(item.quantity * item.unitPrice).toLocaleString(
                            "es-CU",
                          )}{" "}
                          CUP
                        </div>

                        {/* Eliminar */}

                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.productId)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* -------------------------------- */}
            {/* Resumen */}
            {/* -------------------------------- */}

            <div className="border-t pt-6">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Banknote className="h-4 w-4" />

                    <span>Método de pago:</span>

                    <span className="font-medium text-foreground">
                      {paymentType === "EFECTIVO"
                        ? "Efectivo"
                        : paymentType === "TRANSFERENCIA"
                          ? "Transferencia"
                          : "Crédito"}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {items.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                    unidad(es) en {items.length} producto(s)
                  </p>
                </div>

                <div className="sm:text-right">
                  <p className="text-sm text-muted-foreground">
                    Total de la venta
                  </p>

                  <p className="text-4xl font-bold tracking-tight">
                    {total.toLocaleString("es-CU")}{" "}
                    <span className="text-xl font-medium">CUP</span>
                  </p>
                </div>
              </div>

              {/* Botón */}

              <Button
                type="submit"
                className="mt-6 h-12 w-full text-base"
                size="lg"
                disabled={saving || items.length === 0}
              >
                {saving ? "Registrando venta..." : "Registrar venta"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
