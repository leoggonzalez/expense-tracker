import "./info_box.scss";

import React from "react";

import { Icon, Stack, Text } from "@/elements";

type InfoBoxVariant = "warning" | "error" | "info" | "success";

export type InfoBoxProps = {
  variant: InfoBoxVariant;
  title?: string;
  message: string;
};

function getIconName(variant: InfoBoxVariant): "alert" | "check" {
  if (variant === "success") {
    return "check";
  }

  return "alert";
}

export function InfoBox({
  variant,
  title,
  message,
}: InfoBoxProps): React.ReactElement {
  return (
    <div
      className={["info-box", `info-box--${variant}`].filter(Boolean).join(" ")}
      role={variant === "error" ? "alert" : "status"}
    >
      <Stack direction="row" align="flex-start" gap={10}>
        <div className="info-box__icon">
          <Icon name={getIconName(variant)} size={18} />
        </div>
        <Stack gap={4}>
          {title ? (
            <Text size="sm" weight="semibold">
              {title}
            </Text>
          ) : null}
          <Text size="sm">{message}</Text>
        </Stack>
      </Stack>
    </div>
  );
}
