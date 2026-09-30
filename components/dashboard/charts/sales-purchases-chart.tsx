"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Data = {
  name: string;
  ventas: number;
  compras: number;
  utilidad: number;
};

type Props = {
  data: Data[];
};

function formatCurrency(value: number) {
  return `${value.toLocaleString("es-CU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })} CUP`;
}

export function SalesPurchasesChart({
  data,
}: Props) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <BarChart
          data={data}
          margin={{
            top: 10,
            right: 10,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            className="stroke-muted"
          />

          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) =>
              Number(value).toLocaleString(
                "es-CU"
              )
            }
          />

          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid hsl(var(--border))",
              backgroundColor:
                "hsl(var(--background))",
            }}
            formatter={(value, name) => [
              formatCurrency(
                Number(value ?? 0)
              ),
              name === "ventas"
                ? "Ventas"
                : name === "compras"
                  ? "Compras"
                  : "Utilidad",
            ]}
          />

          <Legend />

          <Bar
            dataKey="ventas"
            name="Ventas"
            fill="#6366f1"
            radius={[6, 6, 0, 0]}
          />

          <Bar
            dataKey="compras"
            name="Compras"
            fill="#f59e0b"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}