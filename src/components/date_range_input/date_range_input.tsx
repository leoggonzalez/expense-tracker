import "./date_range_input.scss";

import React from "react";

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
      <label className="date-range-input__label">{label}</label>
      <div className="date-range-input__field">
        <input
          type="date"
          value={startDate}
          onChange={(event) => onStartDateChange(event.target.value)}
          className="date-range-input__input"
        />
        <span className="date-range-input__separator">-</span>
        <input
          type="date"
          value={endDate}
          onChange={(event) => onEndDateChange(event.target.value)}
          className="date-range-input__input"
        />
      </div>
    </div>
  );
}
