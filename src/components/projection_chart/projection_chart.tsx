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
  total: number;
};

type ProjectionChartProps = {
  data: ProjectionChartDataItem[];
};

type ProjectionTooltipProps = {
  active?: boolean;
  payload?: Array<{
    payload?: ProjectionChartDataItem;
  }>;
  label?: string;
};

function formatTooltipValue(value: unknown): string {
  const numericValue = typeof value === "number" ? value : Number(value ?? 0);
  return formatCurrency(Number.isFinite(numericValue) ? numericValue : 0);
}

function ProjectionTooltip({
  active,
  payload,
  label,
}: ProjectionTooltipProps): React.ReactElement | null {
  if (!active || !payload?.length) {
    return null;
  }

  const chartData = payload[0]?.payload as ProjectionChartDataItem | undefined;

  if (!chartData) {
    return null;
  }

  return (
    <div className="projection-chart__tooltip">
      <div className="projection-chart__tooltip-label">{label}</div>
      <div className="projection-chart__tooltip-row">
        <span>{i18n.t("projection_page.income")}</span>
        <strong>{formatTooltipValue(chartData.income)}</strong>
      </div>
      <div className="projection-chart__tooltip-row">
        <span>{i18n.t("projection_page.expenses")}</span>
        <strong>{formatTooltipValue(chartData.expenses)}</strong>
      </div>
      <div className="projection-chart__tooltip-row projection-chart__tooltip-row--total">
        <span>{i18n.t("projection_page.total")}</span>
        <strong>{formatTooltipValue(chartData.total)}</strong>
      </div>
    </div>
  );
}

export function ProjectionChart({
  data,
}: ProjectionChartProps): React.ReactElement {
  return (
    <div className="projection-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid
            stroke="var(--color-border)"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="monthLabel"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
          />
          <Tooltip content={<ProjectionTooltip />} />
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
            fill="var(--color-primary)"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
