"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  categorySchema,
  type CategoryFormData,
} from "@/schema/category.schema";

import { updateCategory } from "@/action/category.action";

import type { Category } from "@/generated/prisma/client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type EditCategoryFormProps = {
  category: Category;
  onUpdated?: (category: Category) => void;
};

export function EditCategoryForm({
  category,
  onUpdated,
}: EditCategoryFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof categorySchema>, unknown, CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category.name,
      description: category.description ?? "",
      active: category.active,
    },
  });

  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmit = async (data: CategoryFormData) => {
    setServerError(null);

    const result = await updateCategory(category.id, data);

    if (!result.success) {
      setServerError(result.error);
      return;
    }

    onUpdated?.(result.category);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-6">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Nombre
        </label>

        <Input id="name" placeholder="Ej. Bebidas" {...register("name")} />

        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}

        {serverError && (
          <p className="text-sm text-destructive">{serverError}</p>
        )}
      </div>

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

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Guardando cambios..." : "Guardar cambios"}
      </Button>
    </form>
  );
}
