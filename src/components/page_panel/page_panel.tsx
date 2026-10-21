import "@/components/page_panel/page_panel.scss";

import React from "react";

import { Card } from "@/elements";

interface PagePanelProps {
  children: React.ReactNode;
  tone?: "default" | "form" | "settings";
}

export function PagePanel({
  children,
  tone = "default",
}: PagePanelProps): React.ReactElement {
  return (
    <div className={`page-panel page-panel--${tone}`}>
      <Card padding={24} radius={28}>
        {children}
      </Card>
    </div>
  );
}
