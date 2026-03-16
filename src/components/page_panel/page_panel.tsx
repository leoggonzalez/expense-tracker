import "./page_panel.scss";

import React from "react";

import { Card } from "@/elements";

type PagePanelProps = {
  children: React.ReactNode;
  tone?: "default" | "form" | "settings";
};

export function PagePanel({
  children,
  tone = "default",
}: PagePanelProps): React.ReactElement {
  return (
    <div className={`page-panel page-panel--${tone}`}>
      <Card padding={24}>{children}</Card>
    </div>
  );
}
