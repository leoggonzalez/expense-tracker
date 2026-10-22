import React from "react";

import { Text, type TextProps } from "@/elements";
import { formatCurrency } from "@/lib/utils";

interface CurrencyProps {
  value: number;
  type?: TextProps["type"];
  element?: TextProps["element"];
  color?: TextProps["color"];
}

function resolveColor(value: number): TextProps["color"] {
  if (value > 0) {
    return "success";
  }

  if (value < 0) {
    return "danger";
  }

  return "primary";
}

export function Currency({
  value,
  type = "body",
  element = "span",
  color,
}: CurrencyProps): React.ReactElement {
  return (
    <Text type={type} color={color || resolveColor(value)} element={element}>
      {formatCurrency(value)}
    </Text>
  );
}
