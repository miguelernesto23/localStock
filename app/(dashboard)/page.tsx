import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Banknote,
  Boxes,
  CircleDollarSign,
  Package,
  ShoppingCart,
  TriangleAlert,
  Wallet,
} from "lucide-react";

import { getDashboardData } from "@/action/dashboard.action";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { SalesChart } from "@/components/dashboard/charts/sales-chart";
import { TopProductsChart } from "@/components/dashboard/charts/top-products-chart";
import { PaymentMethodsChart } from "@/components/dashboard/charts/payment-methods-chart";
import { SalesPurchasesChart } from "@/components/dashboard/charts/sales-purchases-chart";

function formatCurrency(value: number) {
  return `${value.toLocaleString("es-CU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })} CUP`;
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  iconClassName,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  iconClassName: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>

            <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>

            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          </div>

          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClassName}`}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  const { metrics, charts } = data;

  return (
    <main className="container mx-auto max-w-7xl space-y-8 p-6">
      {/* HEADER */}
      <section>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">LocalStock</p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Dashboard
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Resumen general de tu negocio.
            </p>
          </div>

          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/products">
                <Package className="mr-2 h-4 w-4" />
                Productos
              </Link>
            </Button>

            <Button asChild>
              <Link href="/sales/new">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Nueva venta
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* MÉTRICAS PRINCIPALES */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Ventas de hoy"
          value={formatCurrency(metrics.todaySales)}
          description={`${metrics.todaySalesCount} ventas realizadas`}
          icon={ShoppingCart}
          iconClassName="bg-indigo-500/10 text-indigo-500"
        />

        <MetricCard
          title="Ventas del mes"
          value={formatCurrency(metrics.monthSales)}
          description={`${metrics.monthSalesCount} ventas este mes`}
          icon={CircleDollarSign}
          iconClassName="bg-emerald-500/10 text-emerald-500"
        />

        <MetricCard
          title="Utilidad del mes"
          value={formatCurrency(metrics.monthProfit)}
          description="Ganancia estimada"
          icon={ArrowUpFromLine}
          iconClassName="bg-cyan-500/10 text-cyan-500"
        />

        <MetricCard
          title="Dinero disponible"
          value={formatCurrency(metrics.totalCash)}
          description="Saldo de cajas activas"
          icon={Wallet}
          iconClassName="bg-amber-500/10 text-amber-500"
        />
      </section>

      {/* INVENTARIO */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Productos activos"
          value={metrics.productsCount.toString()}
          description="Productos disponibles"
          icon={Boxes}
          iconClassName="bg-violet-500/10 text-violet-500"
        />

        <MetricCard
          title="Valor del inventario"
          value={formatCurrency(metrics.inventoryValue)}
          description="Según costo de adquisición"
          icon={Package}
          iconClassName="bg-blue-500/10 text-blue-500"
        />

        <MetricCard
          title="Stock bajo"
          value={metrics.lowStockCount.toString()}
          description="Requieren reposición"
          icon={TriangleAlert}
          iconClassName="bg-orange-500/10 text-orange-500"
        />

        <MetricCard
          title="Agotados"
          value={metrics.outOfStockCount.toString()}
          description="Sin unidades disponibles"
          icon={ArrowDownToLine}
          iconClassName="bg-red-500/10 text-red-500"
        />
      </section>

      {/* DEUDAS */}
      <section className="grid gap-4 sm:grid-cols-2">
        <Card className="border-orange-500/20 bg-orange-500/3">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Deudas pendientes
              </p>

              <p className="mt-2 text-2xl font-bold">
                {formatCurrency(metrics.pendingDebtAmount)}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {metrics.pendingDebtCount} deudas abiertas
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
              <Banknote className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-blue-500/3">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Compras del mes
              </p>

              <p className="mt-2 text-2xl font-bold">
                {formatCurrency(metrics.monthPurchases)}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {metrics.monthPurchasesCount} compras registradas
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <ArrowDownToLine className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* VENTAS */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Ventas de los últimos 30 días</CardTitle>

          <p className="text-sm text-muted-foreground">
            Evolución de las ventas y utilidad.
          </p>
        </CardHeader>

        <CardContent>
          <SalesChart data={charts.salesByDay} />
        </CardContent>
      </Card>

      {/* PRODUCTOS + MÉTODOS DE PAGO */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Productos más vendidos</CardTitle>

            <p className="text-sm text-muted-foreground">
              Productos con mayor cantidad vendida este mes.
            </p>
          </CardHeader>

          <CardContent>
            <TopProductsChart data={charts.topProducts} />
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Métodos de pago</CardTitle>

            <p className="text-sm text-muted-foreground">
              Distribución de las ventas del mes.
            </p>
          </CardHeader>

          <CardContent>
            <PaymentMethodsChart data={charts.paymentMethods} />
          </CardContent>
        </Card>
      </section>

      {/* COMPRAS VS VENTAS */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Ventas vs compras</CardTitle>

          <p className="text-sm text-muted-foreground">
            Comparación económica del mes actual.
          </p>
        </CardHeader>

        <CardContent>
          <SalesPurchasesChart data={charts.salesVsPurchases} />
        </CardContent>
      </Card>

      {/* STOCK BAJO */}
      {data.lowStockProducts.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Productos con stock bajo</CardTitle>

                <p className="mt-1 text-sm text-muted-foreground">
                  Productos que necesitan reposición.
                </p>
              </div>

              <Button asChild variant="outline" size="sm">
                <Link href="/products">Ver productos</Link>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="divide-y">
              {data.lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between px-6 py-4"
                >
                  <div>
                    <p className="font-medium">{product.name}</p>

                    <p className="text-xs text-muted-foreground">
                      Mínimo: {product.minStock} {product.unit}
                    </p>
                  </div>

                  <div
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      product.stock === 0
                        ? "bg-red-500/10 text-red-600"
                        : "bg-orange-500/10 text-orange-600"
                    }`}
                  >
                    {product.stock === 0
                      ? "Agotado"
                      : `${product.stock} ${product.unit}`}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
