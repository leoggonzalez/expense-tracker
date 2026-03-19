import { ImageResponse } from "next/og";
import React from "react";

import { CurrentoLogo } from "@/lib/currento_logo";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon(): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(145deg, #f1f6f8 0%, #e7f2f3 100%)",
      }}
    >
      <CurrentoLogo size={360} />
    </div>,
    size,
  );
}
