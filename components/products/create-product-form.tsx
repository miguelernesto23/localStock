"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Package,
  Barcode,
  Boxes,
  CircleDollarSign,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { UnitType } from "@/lib/types";
import type { Product } from "@/generated/prisma/client";

import {
  productSchema,
  type ProductFormInput,
  type ProductFormData,
} from "@/schema/product.schema";

import { createProduct } from "@/action/product.action";
import { CategoriesAllAction } from "@/action/category.action";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ProductWithCategory = Product & {
  category: {
    id: number;
    name: string;
  } | null;
};

type CreateProductFormProps = {
  onCreated?: (product: ProductWithCategory) => void;
};

type CategoryOption = {
  id: number;
  name: string;
  active: boolean;
};

const unitOptions = [
  {
    value: UnitType.UNIT,
    label: "Unidad",
    unit: "unidad",
    description: "Productos contados por piezas",
  },
  {
    value: UnitType.GRAM,
    label: "Peso",
    unit: "g",
    description: "Productos medidos por peso",
  },
  {
    value: UnitType.MILLILITER,
    label: "Volumen",
    unit: "ml",
    description: "Productos medidos por volumen",
  },
];

export function CreateProductForm({ onCreated }: CreateProductFormProps) {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormInput, unknown, ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      barcode: "",
      description: "",
      unit: "unidad",
      unitType: UnitType.UNIT,
      price: 0,
      costPrice: 0,
      categoryId: undefined,
      stock: 0,
      minStock: 0,
      active: true,
      presentations: [
        {
          name: "unidad",
          factor: 1,
          canPurchase: true,
          canSell: true,
          active: true,
        },
      ],
    },
  });

  const {
    fields: presentationFields,
    append: appendPresentation,
    remove: removePresentation,
  } = useFieldArray({
    control,
    name: "presentations",
  });

  const selectedUnitType = useWatch({
    control,
    name: "unitType",
  });

  const selectedCategoryId = useWatch({
    control,
    name: "categoryId",
  });

  const selectedUnit = unitOptions.find(
    (option) => option.value === selectedUnitType,
  );

  // Cargar categorías.
  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const result = await CategoriesAllAction();

        if (cancelled) return;

        if (!result.success) {
          console.error(result.error);
          return;
        }

        setCategories(result.categories.filter((category) => category.active));
      } catch (error) {
        if (!cancelled) {
          console.error("Error cargando categorías:", error);
        }
      }
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  // Sincronizar la presentación base con la unidad seleccionada.
  useEffect(() => {
    if (!selectedUnit) return;

    setValue("unit", selectedUnit.unit, {
      shouldValidate: true,
    });

    setValue("presentations.0.name", selectedUnit.unit, {
      shouldValidate: true,
    });

    setValue("presentations.0.factor", 1, {
      shouldValidate: true,
    });
  }, [selectedUnit, setValue]);

  // Crear producto.
  const onSubmit = async (data: ProductFormData) => {
    setServerError(null);

    try {
      const result = await createProduct({
        ...data,
        stock: 0,
      });

      if (!result.success) {
        setServerError(result.error);
        return;
      }

      toast.success("Producto creado correctamente", {
        description: "Ya puedes registrar las existencias desde Compras.",
      });

      onCreated?.(result.product);
    } catch (error) {
      console.error("Error creando producto:", error);

      setServerError("Ocurrió un error al crear el producto.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-2">
      {/* Encabezado */}
      <div className="flex items-start gap-3 rounded-xl border bg-muted/30 p-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Package className="size-5" />
        </div>

        <div className="space-y-1">
          <h3 className="font-semibold">Nuevo producto</h3>

          <p className="text-sm text-muted-foreground">
            Define sus datos, unidad de medida, presentaciones y precios. Podrás
            registrar el stock desde Compras.
          </p>
        </div>
      </div>

      {/* Información general */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-2">
          <Package className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Información general</h3>
        </div>

        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Nombre del producto <span className="text-destructive">*</span>
          </label>

          <Input
            id="name"
            placeholder="Ej. Harina de trigo"
            autoFocus
            {...register("name")}
          />

          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="barcode" className="text-sm font-medium">
              Código de barras
            </label>

            <div className="relative">
              <Barcode className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                id="barcode"
                className="pl-9"
                placeholder="13 dígitos"
                inputMode="numeric"
                maxLength={13}
                {...register("barcode")}
              />
            </div>

            {errors.barcode && (
              <p className="text-sm text-destructive">
                {errors.barcode.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Categoría</label>

            <Select
              value={selectedCategoryId?.toString() ?? ""}
              onValueChange={(value) => {
                setValue("categoryId", Number(value), {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>

              <SelectContent>
                {categories.length === 0 ? (
                  <SelectItem value="no-categories" disabled>
                    No hay categorías disponibles
                  </SelectItem>
                ) : (
                  categories.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id.toString()}
                    >
                      {category.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium">
            Descripción{" "}
            <span className="text-muted-foreground">(opcional)</span>
          </label>

          <Textarea
            id="description"
            placeholder="Detalles adicionales del producto..."
            rows={3}
            {...register("description")}
          />

          {errors.description && (
            <p className="text-sm text-destructive">
              {errors.description.message}
            </p>
          )}
        </div>
      </section>

      {/* Unidad de medida */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-2">
          <Boxes className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Unidad de medida</h3>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Unidad base</label>

          <Select
            value={selectedUnitType}
            onValueChange={(value) => {
              const option = unitOptions.find((item) => item.value === value);

              if (!option) return;

              setValue("unitType", option.value, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar unidad base" />
            </SelectTrigger>

            <SelectContent>
              {unitOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label} ({option.unit}) — {option.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <p className="text-xs text-muted-foreground">
            {selectedUnit?.description}. Esta unidad será la referencia para
            todas las conversiones del inventario.
          </p>
        </div>
      </section>

      {/* Presentaciones */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-2">
            <Boxes className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Presentaciones</h3>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendPresentation({
                name: "",
                factor: 1,
                canPurchase: true,
                canSell: true,
                active: true,
              })
            }
          >
            <Plus className="mr-2 size-4" />
            Añadir
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          El factor indica cuántas unidades base contiene cada presentación. Por
          ejemplo, una caja de 24 paquetes tiene un factor de 24.
        </p>

        {presentationFields.map((field, index) => (
          <div key={field.id} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {index === 0
                  ? "Presentación base"
                  : `Presentación ${index + 1}`}
              </p>

              {index === 0 && (
                <span className="rounded-md bg-primary/10 px-2 py-1 text-xs text-primary">
                  Factor 1
                </span>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre</label>

                <Input
                  placeholder="Ej. Caja"
                  disabled={index === 0}
                  {...register(`presentations.${index}.name`)}
                />

                {errors.presentations?.[index]?.name && (
                  <p className="text-sm text-destructive">
                    {errors.presentations[index]?.name?.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Factor de conversión
                </label>

                <Input
                  type="number"
                  min="0.000001"
                  step="any"
                  disabled={index === 0}
                  {...register(`presentations.${index}.factor`, {
                    valueAsNumber: true,
                  })}
                />

                {errors.presentations?.[index]?.factor && (
                  <p className="text-sm text-destructive">
                    {errors.presentations[index]?.factor?.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-5">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  {...register(`presentations.${index}.canPurchase`)}
                />
                Se puede comprar
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  {...register(`presentations.${index}.canSell`)}
                />
                Se puede vender
              </label>
            </div>

            {index !== 0 && (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => removePresentation(index)}
                >
                  <Trash2 className="mr-2 size-4" />
                  Eliminar
                </Button>
              </div>
            )}
          </div>
        ))}

        {errors.presentations?.root && (
          <p className="text-sm text-destructive">
            {errors.presentations.root.message}
          </p>
        )}
        {errors.presentations?.message && (
          <p className="text-sm text-destructive">
            {errors.presentations.message}
          </p>
        )}
      </section>

      {/* Precios e inventario */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-2">
          <CircleDollarSign className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Precios e inventario</h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="price" className="text-sm font-medium">
              Precio de venta
            </label>

            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register("price", { valueAsNumber: true })}
            />

            {errors.price && (
              <p className="text-sm text-destructive">{errors.price.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="costPrice" className="text-sm font-medium">
              Precio de costo
            </label>

            <Input
              id="costPrice"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register("costPrice", { valueAsNumber: true })}
            />

            {errors.costPrice && (
              <p className="text-sm text-destructive">
                {errors.costPrice.message}
              </p>
            )}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="minStock" className="text-sm font-medium">
              Stock mínimo ({selectedUnit?.unit ?? "unidad"})
            </label>

            <Input
              id="minStock"
              type="number"
              min="0"
              step="any"
              placeholder="0"
              {...register("minStock", { valueAsNumber: true })}
            />

            {errors.minStock && (
              <p className="text-sm text-destructive">
                {errors.minStock.message}
              </p>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          El producto se creará con stock cero. Las existencias se añadirán al
          registrar una compra.
        </p>
      </section>

      {/* Error del servidor */}
      {serverError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3"
        >
          <p className="text-sm text-destructive">{serverError}</p>
        </div>
      )}

      {/* Guardar */}
      <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-end">
        <Button
          type="submit"
          className="w-full sm:w-auto"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Guardando producto..." : "Crear producto"}
        </Button>
      </div>
    </form>
  );
}
