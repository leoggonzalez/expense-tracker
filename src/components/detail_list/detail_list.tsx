import "@/components/detail_list/detail_list.scss";

import React from "react";

interface DetailListProps {
  children: React.ReactNode;
}

export function DetailList({ children }: DetailListProps): React.ReactElement {
  return <div className="detail-list">{children}</div>;
}
