"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SalesData = {
  date: string;
  ventas: number;
  utilidad: number;
  cantidad: number;
};

type Props = {
  data: SalesData[];
};

function formatCurrency(value: number) {
  return `${value.toLocaleString("es-CU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })} CUP`;
}

export function SalesChart({ data }: Props) {
  return (
    <div className="h-[340px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 10,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient
              id="salesGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#6366f1"
                stopOpacity={0.35}
              />

              <stop
                offset="100%"
                stopColor="#6366f1"
                stopOpacity={0.02}
              />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            className="stroke-muted"
          />

          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            className="text-xs"
          />

          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) =>
              `${Number(value).toLocaleString("es-CU")}`
            }
            className="text-xs"
          />

          <Tooltip
            cursor={{
              stroke: "#6366f1",
              strokeDasharray: "4 4",
            }}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid hsl(var(--border))",
              backgroundColor: "hsl(var(--background))",
            }}
            formatter={(value, name) => {
              const numericValue =
                typeof value === "number"
                  ? value
                  : Number(value ?? 0);

              if (name === "ventas") {
                return [
                  formatCurrency(numericValue),
                  "Ventas",
                ];
              }

              return [
                formatCurrency(numericValue),
                "Utilidad",
              ];
            }}
          />

          <Area
            type="monotone"
            dataKey="ventas"
            stroke="#6366f1"
            strokeWidth={3}
            fill="url(#salesGradient)"
          />

          <Area
            type="monotone"
            dataKey="utilidad"
            stroke="#22c55e"
            strokeWidth={2}
            fill="transparent"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}