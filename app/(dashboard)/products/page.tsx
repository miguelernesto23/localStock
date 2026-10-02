"use client";

import { useEffect, useMemo, useState } from "react";

import { AnimatePresence, motion } from "motion/react";

import { Loader2, Pencil, Plus, Power, PowerOff, Search } from "lucide-react";

import type { Product } from "@/generated/prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { getProducts, toggleProductActive } from "@/action/product.action";

import { CreateProductForm } from "@/components/products/create-product-form";
import { EditProductForm } from "@/components/products/edit-product-form";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StockChart } from "@/components/products/charts/stock-chart";
import { BestSellingChart } from "@/components/products/charts/best-selling-chart";

type ProductWithCategory = Product & {
  category: {
    id: number;
    name: string;
  } | null;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] =
    useState<ProductWithCategory | null>(null);

  const [search, setSearch] = useState("");
  const [bestSellingProducts, setBestSellingProducts] = useState<
    {
      id: number;
      name: string;
      sold: number;
    }[]
  >([]);
  // =========================
  // Filtrar productos
  // =========================

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return products;
    }

    return products.filter((product) => {
      const name = product.name.toLowerCase();
      const barcode = product.barcode?.toLowerCase() ?? "";
      const category = product.category?.name.toLowerCase() ?? "";

      return (
        name.includes(term) || barcode.includes(term) || category.includes(term)
      );
    });
  }, [products, search]);

  // =========================
  // Cargar productos
  // =========================

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        setLoading(true);
        setError(null);

        const result = await getProducts();

        if (cancelled) return;

        if (!result.success) {
          setError(result.error);
          return;
        }

        setProducts(result.products);
      } catch (error) {
        if (cancelled) return;

        console.error("Error cargando productos:", error);
        setError("Ocurrió un error inesperado.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  // =========================
  // Crear producto
  // =========================

  const handleCreated = (product: ProductWithCategory) => {
    setProducts((current) => [product, ...current]);
  };

  // =========================
  // Activar / Desactivar
  // =========================

  const handleToggleActive = async (product: ProductWithCategory) => {
    try {
      const result = await toggleProductActive(product.id, !product.active);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setProducts((current) =>
        current.map((item) =>
          item.id === product.id
            ? {
                ...item,
                active: result.product.active,
              }
            : item,
        ),
      );
    } catch (error) {
      console.error("Error cambiando estado del producto:", error);
      setError("Ocurrió un error inesperado.");
    }
  };

  return (
    <div className="space-y-6">
      {/* =========================
          Header
      ========================== */}

      <motion.div
        initial={{
          opacity: 0,
          y: -15,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.45,
          ease: "easeOut",
        }}
        className="flex items-center justify-between"
      >
        <div>
          <motion.h1
            initial={{
              opacity: 0,
              x: -10,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.4,
              delay: 0.05,
            }}
            className="text-2xl font-semibold"
          >
            Productos
          </motion.h1>

          <motion.p
            initial={{
              opacity: 0,
              x: -10,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.4,
              delay: 0.1,
            }}
            className="text-sm text-muted-foreground"
          >
            Gestiona los productos de tu inventario.
          </motion.p>
        </div>

        {/* =========================
            Nuevo producto
        ========================== */}

        <Sheet>
          <SheetTrigger asChild>
            <motion.div
              whileHover={{
                scale: 1.03,
              }}
              whileTap={{
                scale: 0.97,
              }}
            >
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo producto
              </Button>
            </motion.div>
          </SheetTrigger>

          <SheetContent side="right" className="overflow-y-auto p-2">
            <SheetHeader>
              <SheetTitle>Nuevo producto</SheetTitle>
            </SheetHeader>

            <CreateProductForm onCreated={handleCreated} />
          </SheetContent>
        </Sheet>

        {/* =========================
            Editar producto
        ========================== */}

        <Sheet
          open={editingProduct !== null}
          onOpenChange={(open) => {
            if (!open) {
              setEditingProduct(null);
            }
          }}
        >
          <SheetContent side="right" className="overflow-y-auto p-2">
            <SheetHeader>
              <SheetTitle>Editar producto</SheetTitle>
            </SheetHeader>

            <AnimatePresence mode="wait">
              {editingProduct && (
                <motion.div
                  key={editingProduct.id}
                  initial={{
                    opacity: 0,
                    x: 20,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  exit={{
                    opacity: 0,
                    x: 20,
                  }}
                  transition={{
                    duration: 0.25,
                  }}
                >
                  <EditProductForm
                    product={editingProduct}
                    onUpdated={(updatedProduct) => {
                      setProducts((current) =>
                        current.map((product) =>
                          product.id === updatedProduct.id
                            ? updatedProduct
                            : product,
                        ),
                      );

                      setEditingProduct(null);
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </SheetContent>
        </Sheet>
      </motion.div>

      {/* =========================
          Loading
      ========================== */}

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{
              opacity: 0,
              y: 15,
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
            className="rounded-lg border p-8 text-center"
          >
            <motion.div
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear",
              }}
              className="mx-auto w-fit"
            >
              <Loader2 className="h-6 w-6 text-primary" />
            </motion.div>

            <p className="mt-3 text-sm text-muted-foreground">
              Cargando productos...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================
          Error
      ========================== */}

      <AnimatePresence mode="wait">
        {!loading && error && (
          <motion.div
            key="error"
            initial={{
              opacity: 0,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0.98,
            }}
            transition={{
              duration: 0.25,
            }}
            className="rounded-lg border border-destructive/50 p-8 text-center"
          >
            <p className="text-sm text-destructive">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================
          Tabla
      ========================== */}

      {!loading && !error && (
        <motion.div
          initial={{
            opacity: 0,
            y: 15,
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
          className="space-y-4"
        >
          {/* =========================
              Buscador
          ========================== */}

          <div className="flex items-center justify-between gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar producto..."
                className="pl-9"
              />
            </div>

            {search && (
              <p className="text-sm text-muted-foreground">
                {filteredProducts.length}{" "}
                {filteredProducts.length === 1 ? "resultado" : "resultados"}
              </p>
            )}
          </div>

          {/* =========================
              Tabla
          ========================== */}

          <div className="overflow-hidden rounded-lg border">
            <div className="max-h-[60vh] overflow-auto">
              <Table>
                {/* =========================
                    Header
                ========================== */}

                <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
                  <TableRow>
                    <TableHead>Producto</TableHead>

                    <TableHead>Categoría</TableHead>

                    <TableHead className="text-center">
                      Precio de Venta
                    </TableHead>

                    <TableHead className="text-center">Stock</TableHead>

                    <TableHead className="text-center">Estado</TableHead>

                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>

                {/* =========================
                    Body
                ========================== */}

                <TableBody>
                  <AnimatePresence mode="wait">
                    {products.length === 0 ? (
                      <motion.tr
                        key="empty"
                        initial={{
                          opacity: 0,
                          scale: 0.98,
                        }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                        }}
                        exit={{
                          opacity: 0,
                          scale: 0.98,
                        }}
                        transition={{
                          duration: 0.25,
                        }}
                      >
                        <TableCell
                          colSpan={6}
                          className="h-32 text-center text-muted-foreground"
                        >
                          No hay productos registrados.
                        </TableCell>
                      </motion.tr>
                    ) : filteredProducts.length === 0 ? (
                      <motion.tr
                        key="no-results"
                        initial={{
                          opacity: 0,
                          scale: 0.98,
                        }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                        }}
                        exit={{
                          opacity: 0,
                          scale: 0.98,
                        }}
                        transition={{
                          duration: 0.25,
                        }}
                      >
                        <TableCell colSpan={6} className="h-32 text-center">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Search className="h-6 w-6 text-muted-foreground" />

                            <p className="text-sm text-muted-foreground">
                              No se encontraron productos.
                            </p>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSearch("")}
                            >
                              Limpiar búsqueda
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ) : (
                      <AnimatePresence initial={false}>
                        {filteredProducts.map((product, index) => (
                          <motion.tr
                            key={product.id}
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
                              x: 20,
                              scale: 0.98,
                            }}
                            transition={{
                              duration: 0.3,
                              delay: index * 0.04,
                              ease: "easeOut",
                            }}
                            className="border-b transition-colors last:border-0 hover:bg-muted/30"
                          >
                            {/* =========================
                                  Producto
                              ========================== */}

                            <TableCell>
                              <div className="font-medium">{product.name}</div>

                              {product.barcode && (
                                <motion.div
                                  initial={{
                                    opacity: 0,
                                  }}
                                  animate={{
                                    opacity: 1,
                                  }}
                                  transition={{
                                    duration: 0.25,
                                  }}
                                  className="text-xs text-muted-foreground"
                                >
                                  {product.barcode}
                                </motion.div>
                              )}
                            </TableCell>

                            {/* =========================
                                  Categoría
                              ========================== */}

                            <TableCell className="text-muted-foreground">
                              {product.category?.name ?? "Sin categoría"}
                            </TableCell>

                            {/* =========================
                                  Precio
                              ========================== */}

                            <TableCell className="text-center">
                              <motion.span
                                initial={{
                                  opacity: 0,
                                  y: 5,
                                }}
                                animate={{
                                  opacity: 1,
                                  y: 0,
                                }}
                                transition={{
                                  duration: 0.25,
                                }}
                              >
                                ${product.price.toFixed(2)}
                              </motion.span>
                            </TableCell>

                            {/* =========================
                                  Stock
                              ========================== */}

                            <TableCell className="text-center">
                              <span className="inline-flex items-center gap-1">
                                <motion.span
                                  key={product.stock}
                                  initial={{
                                    opacity: 0,
                                    y: 5,
                                  }}
                                  animate={{
                                    opacity: 1,
                                    y: 0,
                                  }}
                                  transition={{
                                    duration: 0.2,
                                  }}
                                >
                                  {product.stock}
                                </motion.span>

                                <span className="text-muted-foreground">
                                  {product.unit}
                                </span>
                              </span>
                            </TableCell>

                            {/* =========================
                                  Estado
                              ========================== */}

                            <TableCell className="text-center">
                              <AnimatePresence mode="wait">
                                <motion.span
                                  key={product.active ? "active" : "inactive"}
                                  initial={{
                                    opacity: 0,
                                    scale: 0.85,
                                  }}
                                  animate={{
                                    opacity: 1,
                                    scale: 1,
                                  }}
                                  exit={{
                                    opacity: 0,
                                    scale: 0.85,
                                  }}
                                  transition={{
                                    duration: 0.2,
                                  }}
                                  className={
                                    product.active
                                      ? "inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                      : "inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                  }
                                >
                                  {product.active ? "Activo" : "Inactivo"}
                                </motion.span>
                              </AnimatePresence>
                            </TableCell>

                            {/* =========================
                                  Acciones
                              ========================== */}

                            <TableCell>
                              <div className="flex justify-center gap-2">
                                {/* Editar */}

                                <motion.div
                                  whileHover={{
                                    scale: 1.04,
                                  }}
                                  whileTap={{
                                    scale: 0.96,
                                  }}
                                >
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingProduct(product)}
                                  >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                  </Button>
                                </motion.div>

                                {/* Activar / Desactivar */}

                                <motion.div
                                  whileHover={{
                                    scale: 1.04,
                                  }}
                                  whileTap={{
                                    scale: 0.96,
                                  }}
                                >
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleToggleActive(product)}
                                    className={
                                      product.active
                                        ? "border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                        : "border-green-500/30 text-green-600 hover:bg-green-500/10 hover:text-green-600 dark:text-green-400"
                                    }
                                  >
                                    <AnimatePresence
                                      mode="wait"
                                      initial={false}
                                    >
                                      {product.active ? (
                                        <motion.span
                                          key="deactivate"
                                          initial={{
                                            opacity: 0,
                                            scale: 0.8,
                                          }}
                                          animate={{
                                            opacity: 1,
                                            scale: 1,
                                          }}
                                          exit={{
                                            opacity: 0,
                                            scale: 0.8,
                                          }}
                                          transition={{
                                            duration: 0.15,
                                          }}
                                          className="flex items-center"
                                        >
                                          <PowerOff className="mr-2 h-4 w-4" />
                                          Desactivar
                                        </motion.span>
                                      ) : (
                                        <motion.span
                                          key="activate"
                                          initial={{
                                            opacity: 0,
                                            scale: 0.8,
                                          }}
                                          animate={{
                                            opacity: 1,
                                            scale: 1,
                                          }}
                                          exit={{
                                            opacity: 0,
                                            scale: 0.8,
                                          }}
                                          transition={{
                                            duration: 0.15,
                                          }}
                                          className="flex items-center"
                                        >
                                          <Power className="mr-2 h-4 w-4" />
                                          Activar
                                        </motion.span>
                                      )}
                                    </AnimatePresence>
                                  </Button>
                                </motion.div>
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          </div>
        </motion.div>
      )}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <StockChart products={products} />

        <BestSellingChart products={bestSellingProducts} />
      </div>
    </div>
  );
}
