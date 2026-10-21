import "@/components/hero_metric/hero_metric.scss";

import React from "react";
import { Box, Stack } from "@/elements";

interface HeroMetricProps {
  children: React.ReactNode;
  tone?: "default" | "soft";
}

export function HeroMetric({
  children,
  tone = "default",
}: HeroMetricProps): React.ReactElement {
  return (
    <div className={`hero-metric hero-metric--${tone}`}>
      <Box
        padding={{
          top: 18,
          right: 20,
          bottom: 18,
          left: 20,
        }}
      >
        <Stack gap={6}>{children}</Stack>
      </Box>
    </div>
  );
}
