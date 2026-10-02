"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

import type { Product } from "@/generated/prisma/client";

type ProductWithCategory = Product & {
  category: {
    id: number;
    name: string;
  } | null;
};

interface StockChartProps {
  products: ProductWithCategory[];
}

const chartConfig = {
  stock: {
    label: "Stock",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function StockChart({ products }: StockChartProps) {
  const chartData = products
    .filter((product) => product.stock > 0)
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 8)
    .map((product) => ({
      name: product.name,
      stock: product.stock,
    }));

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-5">
        <h3 className="text-lg font-semibold">Productos en stock</h3>

        <p className="text-sm text-muted-foreground">
          Productos con mayor cantidad disponible
        </p>
      </div>

      {chartData.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
          No hay productos con stock disponible.
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 10,
              right: 10,
              left: 0,
              bottom: 10,
            }}
          >
            <CartesianGrid vertical={false} />

            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) =>
                value.length > 12 ? `${value.slice(0, 12)}...` : value
              }
            />

            <YAxis tickLine={false} axisLine={false} allowDecimals={false} />

            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />

            <Bar dataKey="stock" fill="var(--color-stock)" radius={6} />
          </BarChart>
        </ChartContainer>
      )}
    </div>
  );
}
