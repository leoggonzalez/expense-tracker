import "./dashboard_panels.scss";

import React from "react";

type DashboardPanelsProps = {
  children: React.ReactNode;
};

export function DashboardPanels({
  children,
}: DashboardPanelsProps): React.ReactElement {
  return <div className="dashboard-panels">{children}</div>;
}
