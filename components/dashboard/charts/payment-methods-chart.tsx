"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type PaymentData = {
  name: string;
  total: number;
  cantidad: number;
};

type Props = {
  data: PaymentData[];
};

const COLORS = [
  "#6366f1",
  "#06b6d4",
  "#22c55e",
  "#f59e0b",
];

function formatCurrency(value: number) {
  return `${value.toLocaleString("es-CU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })} CUP`;
}

export function PaymentMethodsChart({
  data,
}: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-[330px] items-center justify-center text-sm text-muted-foreground">
        No hay ventas registradas este mes.
      </div>
    );
  }

  return (
    <div className="h-[330px] w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={75}
            outerRadius={110}
            paddingAngle={3}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  COLORS[index % COLORS.length]
                }
              />
            ))}
          </Pie>

          <Tooltip
            formatter={(value) => [
              formatCurrency(
                Number(value ?? 0)
              ),
              "Total",
            ]}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid hsl(var(--border))",
              backgroundColor:
                "hsl(var(--background))",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}