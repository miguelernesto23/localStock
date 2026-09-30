"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Calendar, CreditCard, ShoppingCart } from "lucide-react";

import { getSaleById } from "@/action/sale.action";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

type SaleItem = {
  id: number;
  quantity: number;
  price: number | null;
  unitPrice: number | null;
  costPrice: number | null;
  profit: number;
  subtotal: number;
  productName: string | null;
  productId: number | null;
};

type Sale = {
  id: number;
  total: number;
  profit: number;
  paymentType: string | null;
  createdAt: Date;
  items: SaleItem[];
  user: {
    id: number;
    name: string;
    user_name: string;
  };
};

export default function SaleDetailPage() {
  const params = useParams();

  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const saleId = Number(params.id);

  useEffect(() => {
    async function loadSale() {
      try {
        setLoading(true);
        setError("");

        if (!Number.isInteger(saleId) || saleId <= 0) {
          setError("La venta no es válida.");
          toast.error("La venta no es válida.");
          return;
        }

        const result = await getSaleById(saleId);

        if (!result.success) {
          setError(result.error);
          return;
        }

        setSale(result.sale);
      } catch (error) {
        console.error("Error cargando venta:", error);
        setError("No se pudo cargar la venta.");
        toast.error("No se pudo cargar la venta");
      } finally {
        setLoading(false);
      }
    }

    loadSale();
  }, [saleId]);

  function formatCurrency(value: number) {
    return `${value.toLocaleString("es-CU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} CUP`;
  }

  function formatDate(date: Date) {
    return new Date(date).toLocaleString("es-CU", {
      dateStyle: "full",
      timeStyle: "short",
    });
  }

  function getPaymentLabel(paymentType: string | null) {
    switch (paymentType) {
      case "EFECTIVO":
        return "Efectivo";

      case "TRANSFERENCIA":
        return "Transferencia";

      case "CREDITO":
        return "Crédito";

      default:
        return paymentType ?? "No especificado";
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto space-y-6 ">
        <Card>
          <CardContent className="flex min-h-75 items-center justify-center">
            <p className="text-muted-foreground">Cargando venta...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="container mx-auto space-y-6 ">
        <Card>
          <CardContent className="flex min-h-75 flex-col items-center justify-center text-center">
            <p className="font-medium">{error || "La venta no existe."}</p>

            <Button variant="outline" className="mt-4" asChild>
              <Link href="/sales">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a ventas
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-6 ">
      {/* Header */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/sales" className="hover:text-foreground">
              Ventas
            </Link>

            <span>/</span>

            <span>Venta #{sale.id}</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            Venta #{sale.id}
          </h1>

          <p className="text-muted-foreground">
            Detalle de la venta realizada.
          </p>
        </div>

        <Button variant="outline" asChild>
          <Link href="/sales">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
      </div>

      {/* Información general */}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4" />
              Fecha
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-sm">{formatDate(sale.createdAt)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <CreditCard className="h-4 w-4" />
              Método de pago
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="font-medium">{getPaymentLabel(sale.paymentType)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Registrada por
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="font-medium">{sale.user.name}</p>

            <p className="text-sm text-muted-foreground">
              @{sale.user.user_name}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Productos */}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Productos vendidos
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="max-h-[45vh] overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead>Ganancia</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {sale.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.productName ?? "Producto eliminado"}
                    </TableCell>

                    <TableCell>{item.quantity}</TableCell>

                    <TableCell>
                      {formatCurrency(item.unitPrice ?? item.price ?? 0)}
                    </TableCell>

                    <TableCell>{formatCurrency(item.subtotal)}</TableCell>

                    <TableCell>{formatCurrency(item.profit)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Resumen */}

      <div className="flex justify-end">
        <Card className="w-full md:max-w-md">
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Productos</span>

              <span>
                {sale.items.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </div>

            <div className="flex justify-between border-t pt-4">
              <span className="font-medium">Total</span>

              <span className="text-xl font-bold">
                {formatCurrency(sale.total)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Ganancia estimada</span>

              <span className="font-medium">{formatCurrency(sale.profit)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
