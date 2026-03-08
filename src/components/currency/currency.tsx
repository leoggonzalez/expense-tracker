import React from "react";

import { Text, type TextProps } from "@/elements";
import { formatCurrency } from "@/lib/utils";

type CurrencyProps = {
  value: number;
  size?: TextProps["size"];
  weight?: TextProps["weight"];
  as?: TextProps["as"];
};

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
  size = "md",
  weight = "normal",
  as = "span",
}: CurrencyProps): React.ReactElement {
  return (
    <Text size={size} weight={weight} color={resolveColor(value)} as={as}>
      {formatCurrency(value)}
    </Text>
  );
}
