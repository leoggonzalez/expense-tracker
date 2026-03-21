import "./loading_skeleton.scss";

import React from "react";

type LoadingSkeletonProps = {
  width?: string;
  height?: number;
  radius?: number;
};

export function LoadingSkeleton({
  width = "100%",
  height = 16,
  radius = 10,
}: LoadingSkeletonProps): React.ReactElement {
  return (
    <span
      className="loading-skeleton"
      style={
        {
          "--loading-skeleton-width": width,
          "--loading-skeleton-height": `${height}px`,
          "--loading-skeleton-radius": `${radius}px`,
        } as React.CSSProperties
      }
      aria-hidden="true"
    />
  );
}
