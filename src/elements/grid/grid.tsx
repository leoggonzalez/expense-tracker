import React from "react";

import "./grid.scss";

type GridStyle = React.CSSProperties & Record<`--${string}`, string>;

export interface GridProps {
  children: React.ReactNode;
  columns?: string;
  rows?: string;
  gap?: number;
  columnGap?: number;
  rowGap?: number;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "stretch";
  minColumnWidth?: number;
  className?: string;
}

export function Grid({
  children,
  columns,
  rows,
  gap,
  columnGap,
  rowGap,
  align,
  justify,
  minColumnWidth,
  className = "",
}: GridProps): React.ReactElement {
  const style: GridStyle = {};

  if (columns) {
    style["--grid-template-columns"] = columns;
  } else if (minColumnWidth !== undefined) {
    style["--grid-template-columns"] =
      `repeat(auto-fit, minmax(${minColumnWidth}px, 1fr))`;
  }

  if (rows) {
    style["--grid-template-rows"] = rows;
  }

  if (gap !== undefined) {
    style["--grid-gap"] = `${gap}px`;
  }

  if (columnGap !== undefined) {
    style["--grid-column-gap"] = `${columnGap}px`;
  }

  if (rowGap !== undefined) {
    style["--grid-row-gap"] = `${rowGap}px`;
  }

  if (align) {
    style["--grid-align"] = align;
  }

  if (justify) {
    style["--grid-justify"] = justify;
  }

  return (
    <div className={`grid ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}
