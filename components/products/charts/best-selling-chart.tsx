"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface BestSellingProduct {
  id: number;
  name: string;
  sold: number;
}

interface BestSellingChartProps {
  products: BestSellingProduct[];
}

const chartConfig = {
  sold: {
    label: "Vendidos",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function BestSellingChart({ products }: BestSellingChartProps) {
  const chartData = products
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 8)
    .map((product) => ({
      name: product.name,
      sold: product.sold,
    }));

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-5">
        <h3 className="text-lg font-semibold">Productos más vendidos</h3>

        <p className="text-sm text-muted-foreground">
          Productos con mayor cantidad de unidades vendidas
        </p>
      </div>

      {chartData.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
          Todavía no hay ventas registradas.
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

            <Bar dataKey="sold" fill="var(--color-sold)" radius={6} />
          </BarChart>
        </ChartContainer>
      )}
    </div>
  );
}
