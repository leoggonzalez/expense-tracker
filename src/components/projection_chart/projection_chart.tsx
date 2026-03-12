"use client";

import "./projection_chart.scss";

import React from "react";
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

import { i18n } from "@/model/i18n";
import { formatCurrency } from "@/lib/utils";

type ProjectionChartDataItem = {
  monthLabel: string;
  income: number;
  expenses: number;
};

type ProjectionChartProps = {
  data: ProjectionChartDataItem[];
};

function formatTooltipValue(value: unknown): string {
  const numericValue = typeof value === "number" ? value : Number(value ?? 0);
  return formatCurrency(Number.isFinite(numericValue) ? numericValue : 0);
}

export function ProjectionChart({
  data,
}: ProjectionChartProps): React.ReactElement {
  return (
    <div className="projection-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="monthLabel" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip formatter={(value) => formatTooltipValue(value)} />
          <Legend />
          <Bar
            dataKey="income"
            name={i18n.t("projection_page.income") as string}
            fill="var(--color-success)"
            radius={[6, 6, 0, 0]}
          />
          <Bar
            dataKey="expenses"
            name={i18n.t("projection_page.expenses") as string}
            fill="var(--color-danger)"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
