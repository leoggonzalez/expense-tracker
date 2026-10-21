import "@/components/info_box/info_box.scss";

import React from "react";

import { Box, Icon, Stack, Text } from "@/elements";

type InfoBoxVariant = "warning" | "error" | "info" | "success";

export interface InfoBoxProps {
  variant: InfoBoxVariant;
  title?: string;
  message: string;
  accent?: "default" | "primary";
  radius?: "default" | "xl";
}

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
  accent = "default",
  radius = "default",
}: InfoBoxProps): React.ReactElement {
  return (
    <div
      className={[
        "info-box",
        `info-box--${variant}`,
        `info-box--accent-${accent}`,
        `info-box--radius-${radius}`,
      ]
        .filter(Boolean)
        .join(" ")}
      role={variant === "error" ? "alert" : "status"}
    >
      <Box padding={16}>
        <Stack line align="start" gap={10}>
          <div className="info-box__icon">
            <Icon name={getIconName(variant)} size={18} />
          </div>
          <Stack gap={4}>
            {title ? (
              <Text element="p" type="caption-semibold">
                {title}
              </Text>
            ) : null}
            <Text element="p" type="caption">
              {message}
            </Text>
          </Stack>
        </Stack>
      </Box>
    </div>
  );
}
