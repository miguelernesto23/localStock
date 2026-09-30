"use client";

import { useEffect, useState } from "react";

import { AnimatePresence, motion } from "motion/react";

import { Pencil, Plus, Power, PowerOff, Loader2 } from "lucide-react";

import { EditCategoryForm } from "@/components/category/edit-category-form";
import type { Category } from "@/generated/prisma/client";

import { Button } from "@/components/ui/button";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import {
  CategoriesAllAction,
  toggleCategoryActive,
} from "@/action/category.action";

import { CreateCategoryForm } from "@/components/category/create-category-form";
import { DeleteCategory } from "@/components/category/delete-category";

import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type CategoryWithCount = Category & {
  _count?: {
    products?: number;
  };
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [editingCategory, setEditingCategory] =
    useState<CategoryWithCount | null>(null);

  // =========================
  // Cargar categorías
  // =========================

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        setLoading(true);
        setError(null);

        const result = await CategoriesAllAction();

        if (cancelled) return;

        if (!result.success) {
          setError(result.error);
          return;
        }

        setCategories(result.categories);
      } catch (error) {
        if (cancelled) return;

        console.error("Error cargando categorías:", error);

        setError("Ocurrió un error inesperado");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  // =========================
  // Crear categoría
  // =========================

  const handleCreated = (category: Category) => {
    setCategories((current) => [
      {
        ...category,
        _count: {
          products: 0,
        },
      },
      ...current,
    ]);

    toast.success("Categoría creada correctamente", {
      position: "top-center",
    });
  };

  // =========================
  // Activar / Desactivar
  // =========================

  const handleToggleActive = async (category: CategoryWithCount) => {
    try {
      const result = await toggleCategoryActive(category.id, !category.active);

      if (!result.success) {
        setError(result.error);
        toast.error(result.error, {
          position: "top-center",
        });
        return;
      }

      setCategories((current) =>
        current.map((item) =>
          item.id === category.id
            ? {
                ...item,
                active: result.category.active,
              }
            : item,
        ),
      );

      const message = result.category.active
        ? "Categoría activada"
        : "Categoría desactivada";

      toast.success(message, {
        position: "top-center",
      });
    } catch (error) {
      console.error("Error cambiando estado:", error);

      toast.error("Ocurrió un error inesperado", {
        position: "top-center",
      });
    }
  };

  // =========================
  // Render
  // =========================

  return (
    <div className="space-y-6">
      {/* =========================
          Encabezado
      ========================== */}

      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.45,
          ease: "easeOut",
        }}
        className="flex items-center justify-between"
      >
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.05,
            }}
            className="text-2xl font-semibold"
          >
            Categorías
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.1,
            }}
            className="text-sm text-muted-foreground"
          >
            Gestiona las categorías de tus productos.
          </motion.p>
        </div>

        {/* =========================
            Crear categoría
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
                Nueva categoría
              </Button>
            </motion.div>
          </SheetTrigger>

          <SheetContent side="right" className="p-2">
            <SheetHeader>
              <SheetTitle>Nueva categoría</SheetTitle>
            </SheetHeader>

            <CreateCategoryForm onCreated={handleCreated} />
          </SheetContent>
        </Sheet>

        {/* =========================
            Editar categoría
        ========================== */}

        <Sheet
          open={editingCategory !== null}
          onOpenChange={(open) => {
            if (!open) {
              setEditingCategory(null);
            }
          }}
        >
          <SheetContent side="right" className="p-2">
            <SheetHeader>
              <SheetTitle>Editar categoría</SheetTitle>
            </SheetHeader>

            <AnimatePresence mode="wait">
              {editingCategory && (
                <motion.div
                  key={editingCategory.id}
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
                  <EditCategoryForm
                    category={editingCategory}
                    onUpdated={(updatedCategory) => {
                      setCategories((current) =>
                        current.map((category) =>
                          category.id === updatedCategory.id
                            ? {
                                ...category,
                                ...updatedCategory,
                              }
                            : category,
                        ),
                      );

                      setEditingCategory(null);

                      toast.success("Categoría actualizada correctamente", {
                        position: "top-center",
                      });
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
              Cargando categorías...
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
          className="overflow-hidden rounded-lg border"
        >
          <div className="max-h-[60vh] overflow-auto">
            <Table>
              {/* =========================
                  Header
              ========================== */}

              <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
                <TableRow>
                  <TableHead>Nombre</TableHead>

                  <TableHead>Descripción</TableHead>

                  <TableHead className="text-center">Productos</TableHead>

                  <TableHead className="text-center">Estado</TableHead>

                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>

              {/* =========================
                  Body
              ========================== */}

              <TableBody>
                {/* =========================
                    Empty state
                ========================== */}

                <AnimatePresence mode="wait">
                  {categories.length === 0 ? (
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
                        colSpan={5}
                        className="h-32 text-center text-muted-foreground"
                      >
                        No hay categorías registradas.
                      </TableCell>
                    </motion.tr>
                  ) : (
                    <AnimatePresence initial={false}>
                      {categories.map((category, index) => (
                        <motion.tr
                          key={category.id}
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
                          className="border-b last:border-0 transition-colors hover:bg-muted/30"
                        >
                          {/* Nombre */}

                          <TableCell className="font-medium">
                            {category.name}
                          </TableCell>

                          {/* Descripción */}

                          <TableCell className="text-muted-foreground">
                            {category.description || "Sin descripción"}
                          </TableCell>

                          {/* Productos */}

                          <TableCell className="text-center">
                            <motion.span
                              key={category._count?.products ?? 0}
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
                              className="inline-flex min-w-8 items-center justify-center rounded-full bg-muted px-2 py-1 text-xs font-medium"
                            >
                              {category._count?.products ?? 0}
                            </motion.span>
                          </TableCell>

                          {/* Estado */}

                          <TableCell className="text-center">
                            <AnimatePresence mode="wait">
                              <motion.span
                                key={category.active ? "active" : "inactive"}
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
                                  category.active
                                    ? "inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    : "inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                }
                              >
                                {category.active ? "Activa" : "Inactiva"}
                              </motion.span>
                            </AnimatePresence>
                          </TableCell>

                          {/* Acciones */}

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
                                  onClick={() => setEditingCategory(category)}
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
                                  onClick={() => handleToggleActive(category)}
                                  className={
                                    category.active
                                      ? "border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                      : "border-green-500/30 text-green-600 hover:bg-green-500/10 hover:text-green-600 dark:text-green-400"
                                  }
                                >
                                  {category.active ? (
                                    <>
                                      <PowerOff className="mr-2 h-4 w-4" />
                                      Desactivar
                                    </>
                                  ) : (
                                    <>
                                      <Power className="mr-2 h-4 w-4" />
                                      Activar
                                    </>
                                  )}
                                </Button>
                              </motion.div>

                              {/* Eliminar */}

                              <motion.div
                                whileHover={{
                                  scale: 1.04,
                                }}
                                whileTap={{
                                  scale: 0.96,
                                }}
                              >
                                <DeleteCategory
                                  id={category.id}
                                  name={category.name}
                                  productCount={category._count?.products ?? 0}
                                  onDeleted={(id) => {
                                    setCategories((current) =>
                                      current.filter(
                                        (category) => category.id !== id,
                                      ),
                                    );
                                  }}
                                />
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
        </motion.div>
      )}
    </div>
  );
}
