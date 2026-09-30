"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  categorySchema,
  type CategoryFormData,
} from "@/schema/category.schema";

import { createCategory } from "@/action/category.action";

import type { Category } from "@/generated/prisma/client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import z from "zod";
type CreateCategoryFormProps = {
  onCreated?: (category: Category) => void;
};

export function CreateCategoryForm({ onCreated }: CreateCategoryFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof categorySchema>, unknown, CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      active: true,
    },
  });

  const onSubmit = async (data: CategoryFormData) => {
    const result = await createCategory(data);

    if (!result.success) {
      console.error(result.error);
      return;
    }

    onCreated?.(result.category);

    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-6">
      {/* Nombre */}
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Nombre
        </label>

        <Input id="name" placeholder="Ej. Bebidas" {...register("name")} />

        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Descripción */}
      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          Descripción
        </label>

        <Input
          id="description"
          placeholder="Ej. Refrescos, jugos y bebidas"
          {...register("description")}
        />

        {errors.description && (
          <p className="text-sm text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Botón */}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Guardando..." : "Crear categoría"}
      </Button>
    </form>
  );
}
