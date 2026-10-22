import "@/components/hero_metrics/hero_metrics.scss";

import React from "react";

interface HeroMetricsProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
}

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
