"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  productSchema,
  type ProductFormInput,
  type ProductFormData,
} from "@/schema/product.schema";

import { createProduct } from "@/action/product.action";

import { CategoriesAllAction } from "@/action/category.action";

import type { Product } from "@/generated/prisma/client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

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

export function CreateProductForm({ onCreated }: CreateProductFormProps) {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormInput, unknown, ProductFormData>({
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

  useEffect(() => {
    async function loadCategories() {
      const result = await CategoriesAllAction();

      if (!result.success) {
        console.error(result.error);
        return;
      }

      setCategories(result.categories.filter((category) => category.active));
    }

    loadCategories();
  }, []);

  const onSubmit = async (data: ProductFormData) => {
    setServerError(null);

    const result = await createProduct({
      ...data,
      stock: 0,
    });

    if (!result.success) {
      setServerError(result.error);
      return;
    }

    onCreated?.(result.product);
    toast.success(
      "Produto añadido con Exito .Valla a compras para añadir productos al sctok ",
    );
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

        <Select
          onValueChange={(value) => {
            setValue("categoryId", Number(value), {
              shouldValidate: true,
            });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una categoría" />
          </SelectTrigger>

          <SelectContent>
            {categories.length === 0 ? (
              <SelectItem value="no-categories" disabled>
                No hay categorías disponibles
              </SelectItem>
            ) : (
              categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

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
          placeholder="0.00"
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
          placeholder="0.00"
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
          placeholder="0"
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

      {/* Guardar */}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Guardando..." : "Crear producto"}
      </Button>
    </form>
  );
}
