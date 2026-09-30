"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { productSchema, type ProductFormData } from "@/schema/product.schema";

import { updateProduct } from "@/action/product.action";
import { CategoriesAllAction } from "@/action/category.action";

import type { Product } from "@/generated/prisma/client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import z from "zod";
import { Check, ChevronsUpDown } from "lucide-react";

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
type ProductWithCategory = Product & {
  category: {
    id: number;
    name: string;
  } | null;
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

export function EditProductForm({ product, onUpdated }: EditProductFormProps) {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof productSchema>, unknown, ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      barcode: "",
      description: "",
      unit: "unidad",
      price: 0,
      costPrice: 0,
      categoryId: undefined,
      minStock: 0,
      active: true,
    },
  });

  const selectedCategoryId = useWatch({
    control,
    name: "categoryId",
  });

  useEffect(() => {
    async function loadCategories() {
      const result = await CategoriesAllAction();

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-6">
      {/* Nombre */}
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Nombre
        </label>

        <Input id="name" placeholder="Ej. Coca Cola" {...register("name")} />

        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Código de barras */}
      <div className="space-y-2">
        <label htmlFor="barcode" className="text-sm font-medium">
          Código de barras
        </label>

        <Input
          id="barcode"
          placeholder="Ej. 1234567890123"
          inputMode="numeric"
          maxLength={13}
          {...register("barcode")}
        />

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
              {selectedCategoryId
                ? (categories.find(
                    (category) => category.id === selectedCategoryId,
                  )?.name ?? "Selecciona una categoría")
                : "Selecciona una categoría"}

              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                        });

                        setCategoryOpen(false);
                      }}
                    >
                      <Check
                        className={
                          selectedCategoryId === category.id
                            ? "mr-2 h-4 w-4 opacity-100"
                            : "mr-2 h-4 w-4 opacity-0"
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

        {errors.categoryId && (
          <p className="text-sm text-destructive">
            {errors.categoryId.message}
          </p>
        )}
      </div>

      {/* Descripción */}
      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          Descripción
        </label>

        <Input
          id="description"
          placeholder="Descripción del producto"
          {...register("description")}
        />

        {errors.description && (
          <p className="text-sm text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Unidad */}
      <div className="space-y-2">
        <label htmlFor="unit" className="text-sm font-medium">
          Unidad
        </label>

        <Input
          id="unit"
          placeholder="Ej. unidad, kg, litro"
          {...register("unit")}
        />

        {errors.unit && (
          <p className="text-sm text-destructive">{errors.unit.message}</p>
        )}
      </div>

      {/* Precio de venta */}
      <div className="space-y-2">
        <label htmlFor="price" className="text-sm font-medium">
          Precio de venta
        </label>

        <Input
          id="price"
          type="number"
          step="0.01"
          min="0"
          {...register("price", {
            valueAsNumber: true,
          })}
        />

        {errors.price && (
          <p className="text-sm text-destructive">{errors.price.message}</p>
        )}
      </div>

      {/* Precio de costo */}
      <div className="space-y-2">
        <label htmlFor="costPrice" className="text-sm font-medium">
          Precio de costo
        </label>

        <Input
          id="costPrice"
          type="number"
          step="0.01"
          min="0"
          {...register("costPrice", {
            valueAsNumber: true,
          })}
        />

        {errors.costPrice && (
          <p className="text-sm text-destructive">{errors.costPrice.message}</p>
        )}
      </div>

      {/* Stock mínimo */}
      <div className="space-y-2">
        <label htmlFor="minStock" className="text-sm font-medium">
          Stock mínimo
        </label>

        <Input
          id="minStock"
          type="number"
          min="0"
          step="1"
          {...register("minStock", {
            valueAsNumber: true,
          })}
        />

        {errors.minStock && (
          <p className="text-sm text-destructive">{errors.minStock.message}</p>
        )}
      </div>

      {/* Error del servidor */}
      {serverError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2">
          <p className="text-sm text-destructive">{serverError}</p>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Guardando cambios..." : "Guardar cambios"}
      </Button>
    </form>
  );
}
