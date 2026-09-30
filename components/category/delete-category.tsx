"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import { deleteCategory } from "@/action/category.action";

import { Button } from "@/components/ui/button";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type DeleteCategoryProps = {
  id: number;
  name: string;
  productCount: number;
  onDeleted?: (id: number) => void;
};

export function DeleteCategory({
  id,
  name,
  productCount,
  onDeleted,
}: DeleteCategoryProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const hasProducts = productCount > 0;

  const handleDelete = async () => {
    try {
      setLoading(true);

      const result = await deleteCategory(id);

      if (!result.success) {
        toast.error(result.error, { position: "top-center" });

        return;
      }

      setOpen(false);
      onDeleted?.(id);
    } catch (error) {
      console.error("Error eliminando categoría:", error);
      toast.error("Ocurrió un error al eliminar la categoría.", {
        position: "top-center",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        disabled={loading || hasProducts}
        onClick={() => setOpen(true)}
        title={
          hasProducts
            ? "No puedes eliminar una categoría que tiene productos"
            : "Eliminar categoría"
        }
      >
        <Trash2 className="mr-1 h-4 w-4" />
        {loading ? "Eliminando..." : "Eliminar"}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>

            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar la categoría
              <span className="font-semibold text-foreground">`{name}`</span>
              ?
              <br />
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>

            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Eliminando..." : "Sí, eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
