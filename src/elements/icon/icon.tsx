import React from "react";

import type { IconName } from "./icon_assets";
import { iconAssets } from "./icon_assets";
import "./icon.scss";

type IconSize = number | { width: number; height: number };

export interface IconProps {
  name: IconName;
  size?: IconSize;
  className?: string;
}

function getIconDimensions(size: IconSize): { width: string; height: string } {
  if (typeof size === "number") {
    return {
      width: `${size}px`,
      height: `${size}px`,
    };
  }

  return {
    width: `${size.width}px`,
    height: `${size.height}px`,
  };
}

export function Icon({
  name,
  size = 20,
  className = "",
}: IconProps): React.ReactElement {
  const dimensions = getIconDimensions(size);
  const style = {
    "--icon-width": dimensions.width,
    "--icon-height": dimensions.height,
    "--icon-mask-image": `url("${iconAssets[name]}")`,
  } as React.CSSProperties;

  return (
    <span
      aria-hidden="true"
      className={`icon ${className}`.trim()}
      style={style}
    />
  );
}
