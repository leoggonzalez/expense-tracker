import "./detail_list.scss";

import React from "react";

type DetailListProps = {
  children: React.ReactNode;
};

type DetailRowProps = {
  label: React.ReactNode;
  value: React.ReactNode;
};

export function DetailList({ children }: DetailListProps): React.ReactElement {
  return <div className="detail-list">{children}</div>;
}

export function DetailRow({
  label,
  value,
}: DetailRowProps): React.ReactElement {
  return (
    <div className="detail-list__row">
      <div>{label}</div>
      <div>{value}</div>
    </div>
  );
}
