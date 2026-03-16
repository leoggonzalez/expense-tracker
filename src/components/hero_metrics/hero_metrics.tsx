import "./hero_metrics.scss";

import React from "react";

type HeroMetricsProps = {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
};

type HeroMetricProps = {
  children: React.ReactNode;
  tone?: "default" | "soft";
};

export function HeroMetrics({
  children,
  columns = 3,
}: HeroMetricsProps): React.ReactElement {
  return (
    <div className={`hero-metrics hero-metrics--columns-${columns}`}>
      {children}
    </div>
  );
}

export function HeroMetric({
  children,
  tone = "default",
}: HeroMetricProps): React.ReactElement {
  return <div className={`hero-metric hero-metric--${tone}`}>{children}</div>;
}
