"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ProductData = {
  name: string;
  cantidad: number;
  ventas: number;
  utilidad: number;
};

type Props = {
  data: ProductData[];
};

export function TopProductsChart({ data }: Props) {
  const chartData = data.slice(0, 8).map((item) => ({
    ...item,
    nombre:
      item.name.length > 18
        ? `${item.name.substring(0, 18)}...`
        : item.name,
  }));

  return (
    <div className="h-82.5 w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{
            top: 5,
            right: 10,
            left: 10,
            bottom: 5,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            className="stroke-muted"
          />

          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />

          <YAxis
            type="category"
            dataKey="nombre"
            axisLine={false}
            tickLine={false}
            width={110}
            className="text-xs"
          />

          <Tooltip
            cursor={{
              fill: "hsl(var(--muted))",
            }}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid hsl(var(--border))",
              backgroundColor:
                "hsl(var(--background))",
            }}
            formatter={(value) => [
              `${Number(value ?? 0)} unidades`,
              "Vendidas",
            ]}
          />

          <Bar
            dataKey="cantidad"
            fill="#8b5cf6"
            radius={[0, 8, 8, 0]}
            barSize={22}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}