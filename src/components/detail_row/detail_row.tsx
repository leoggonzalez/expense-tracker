import "@/components/detail_row/detail_row.scss";

import React from "react";
import { Box, Stack } from "@/elements";

interface DetailRowProps {
  label: React.ReactNode;
  value: React.ReactNode;
}

export function DetailRow({
  label,
  value,
}: DetailRowProps): React.ReactElement {
  return (
    <div className="detail-row">
      <Box
        padding={{
          top: 16,
          right: 24,
          bottom: 16,
          left: 24,
        }}
      >
        <Stack line align="center" justify="space-between" gap={16}>
          <div>{label}</div>
          <div>{value}</div>
        </Stack>
      </Box>
    </div>
  );
}
