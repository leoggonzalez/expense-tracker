import "@/components/date_range_input/date_range_input.scss";

import { Box, Stack, Text } from "@/elements";
import React from "react";

interface DateRangeInputProps {
  label: React.ReactNode;
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
}

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
        <Text element="span" type="caption-medium">
          {label}
        </Text>
        <div className="date-range-input__field">
          <Box padding={{ right: 16, left: 16 }}>
            <div className="date-range-input__field-layout">
              <input
                type="date"
                value={startDate}
                onChange={(event) => onStartDateChange(event.target.value)}
                className="date-range-input__input"
              />
              <Text element="span" type="body-medium" color="secondary">
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
