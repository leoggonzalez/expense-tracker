import "./detail_list.scss";

import React from "react";
import { Box, Stack } from "@/elements";

type DetailListProps = {
  children: React.ReactNode;
};

type DetailRowProps = {
  label: React.ReactNode;
  value: React.ReactNode;
};

export function DetailList({ children }: DetailListProps): React.ReactElement {
  return <div className="detail-list">{children}</div>;
}

export function DetailRow({
  label,
  value,
}: DetailRowProps): React.ReactElement {
  return (
    <div className="detail-list__row">
      <Box
        padding={{ paddingTop: 16, paddingRight: 24, paddingBottom: 16, paddingLeft: 24 }}
      >
        <Stack direction="row" align="center" justify="space-between" gap={16}>
          <div>{label}</div>
          <div>{value}</div>
        </Stack>
      </Box>
    </div>
  );
}
