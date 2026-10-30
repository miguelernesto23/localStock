"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Barcode,
  Boxes,
  Check,
  ChevronsUpDown,
  CircleDollarSign,
  Package,
  Plus,
  Trash2,
} from "lucide-react";

import {
  productSchema,
  type ProductFormInput,
  type ProductFormData,
} from "@/schema/product.schema";

import { updateProduct } from "@/action/product.action";
import { CategoriesAllAction } from "@/action/category.action";

import { UnitType } from "@/lib/types";
import type { Product } from "@/generated/prisma/client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  presentations: {
    id: number;
    name: string;
    factor: number;
    canPurchase: boolean;
    canSell: boolean;
    active: boolean;
    productId: number;
    createdAt: Date;
    updatedAt: Date;
  }[];
};

type EditProductFormProps = {
  product: ProductWithCategory;
  onUpdated?: (product: ProductWithCategory) => void;
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

export function EditProductForm({ product, onUpdated }: EditProductFormProps) {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
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

  const selectedActive = useWatch({
    control,
    name: "active",
  });

  const selectedUnit = unitOptions.find(
    (option) => option.value === selectedUnitType,
  );

  // Cargar los datos del producto y sus presentaciones.
  useEffect(() => {
    reset({
      name: product.name,
      barcode: product.barcode ?? "",
      description: product.description ?? "",
      unit: product.unit,
      unitType: product.unitType,
      price: product.price,
      costPrice: product.costPrice,
      categoryId: product.categoryId ?? undefined,
      stock: product.stock,
      minStock: product.minStock,
      active: product.active,

      presentations:
        product.presentations?.length > 0
          ? product.presentations.map((presentation) => ({
              name: presentation.name,
              factor: presentation.factor,
              canPurchase: presentation.canPurchase,
              canSell: presentation.canSell,
              active: presentation.active,
            }))
          : [
              {
                name: product.unit,
                factor: 1,
                canPurchase: true,
                canSell: true,
                active: true,
              },
            ],
    });
  }, [product, reset]);

  // Cargar categorías.
  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      const result = await CategoriesAllAction();

      if (cancelled) return;

      if (!result.success) {
        console.error(result.error);
        return;
      }

      setCategories(
        result.categories.filter(
          (category) => category.active || category.id === product.categoryId,
        ),
      );
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, [product.categoryId]);

  const onSubmit = async (data: ProductFormData) => {
    setServerError(null);

    const result = await updateProduct(product.id, {
      ...data,
      stock: product.stock,
    });

    if (!result.success) {
      setServerError(result.error);
      return;
    }

    onUpdated?.(result.product);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-2">
      {/* Encabezado */}
      <div className="flex items-start gap-3 rounded-xl border bg-muted/30 p-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Package className="size-5" />
        </div>

        <div className="space-y-1">
          <h3 className="font-semibold">Editar producto</h3>

          <p className="text-sm text-muted-foreground">
            Modifica la información, unidad de medida, presentaciones y precios.
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
            Nombre del producto
          </label>

          <Input id="name" placeholder="Ej. Coca Cola" {...register("name")} />

          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

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
            <p className="text-sm text-destructive">{errors.barcode.message}</p>
          )}
        </div>

        {/* Categoría */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Categoría</label>

          <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={categoryOpen}
                className="w-full justify-between font-normal"
              >
                {selectedCategoryId != null
                  ? (categories.find(
                      (category) => category.id === selectedCategoryId,
                    )?.name ?? "Selecciona una categoría")
                  : "Selecciona una categoría"}

                <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>

            <PopoverContent
              className="w-(--radix-popover-trigger-width) p-0"
              align="start"
            >
              <Command>
                <CommandInput placeholder="Buscar categoría..." />

                <CommandList>
                  <CommandEmpty>No se encontró ninguna categoría.</CommandEmpty>

                  <CommandGroup>
                    {categories.map((category) => (
                      <CommandItem
                        key={category.id}
                        value={category.name}
                        onSelect={() => {
                          setValue("categoryId", category.id, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });

                          setCategoryOpen(false);
                        }}
                      >
                        <Check
                          className={
                            selectedCategoryId === category.id
                              ? "mr-2 size-4 opacity-100"
                              : "mr-2 size-4 opacity-0"
                          }
                        />

                        {category.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium">
            Descripción
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

              setValue("unit", option.unit, {
                shouldValidate: true,
                shouldDirty: true,
              });

              setValue("presentations.0.name", option.unit, {
                shouldValidate: true,
                shouldDirty: true,
              });

              setValue("presentations.0.factor", 1, {
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
                  {option.label} ({option.unit})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <p className="text-xs text-muted-foreground">
            {selectedUnit?.description}
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
              min="0"
              step="0.01"
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
              min="0"
              step="0.01"
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
              Stock mínimo ({selectedUnit?.unit ?? product.unit})
            </label>

            <Input
              id="minStock"
              type="number"
              min="0"
              step="any"
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
          Las existencias actuales se mantienen sin cambios. Para modificar el
          stock, utiliza las operaciones de inventario.
        </p>
      </section>

      {/* Estado */}
      <section className="space-y-2">
        <label className="text-sm font-medium">Estado</label>

        <Select
          value={selectedActive ? "active" : "inactive"}
          onValueChange={(value) => {
            setValue("active", value === "active", {
              shouldValidate: true,
              shouldDirty: true,
            });
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="active">Activo</SelectItem>
            <SelectItem value="inactive">Inactivo</SelectItem>
          </SelectContent>
        </Select>
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
      <div className="flex justify-end border-t pt-4">
        <Button
          type="submit"
          className="w-full sm:w-auto"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Guardando cambios..." : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
