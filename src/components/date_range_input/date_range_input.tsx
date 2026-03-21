import "./date_range_input.scss";

import React from "react";
import { Box, Stack, Text } from "@/elements";

type DateRangeInputProps = {
  label: React.ReactNode;
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
};

export function DateRangeInput({
  label,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateRangeInputProps): React.ReactElement {
  return (
    <div className="date-range-input">
      <Stack gap={4}>
        <Text as="span" size="sm" weight="medium">
          {label}
        </Text>
        <div className="date-range-input__field">
          <Box padding={{ paddingRight: 16, paddingLeft: 16 }}>
            <div className="date-range-input__field-layout">
              <input
                type="date"
                value={startDate}
                onChange={(event) => onStartDateChange(event.target.value)}
                className="date-range-input__input"
              />
              <Text as="span" size="md" weight="medium" color="secondary">
                -
              </Text>
              <input
                type="date"
                value={endDate}
                onChange={(event) => onEndDateChange(event.target.value)}
                className="date-range-input__input"
              />
            </div>
          </Box>
        </div>
      </Stack>
    </div>
  );
}
