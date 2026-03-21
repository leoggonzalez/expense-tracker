import { ImageResponse } from "next/og";
import React from "react";

import { CurrentoLogo } from "@/lib/currento_logo";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon(): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
      }}
    >
      <CurrentoLogo size={148} />
    </div>,
    size,
  );
}
