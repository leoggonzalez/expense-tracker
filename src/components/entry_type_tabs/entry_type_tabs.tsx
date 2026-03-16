import "./entry_type_tabs.scss";

import React from "react";

import { AppLink } from "@/components/app_link/app_link";
import { Icon } from "@/elements";

type EntryPageType = "income" | "expense" | "transfer";

type EntryTypeTabsProps = {
  activeType: EntryPageType;
  tabs: Array<{
    key: EntryPageType;
    href: string;
    label: React.ReactNode;
  }>;
};

export function EntryTypeTabs({
  activeType,
  tabs,
}: EntryTypeTabsProps): React.ReactElement {
  return (
    <div className="entry-type-tabs">
      {tabs.map((tab) => (
        <div
          key={tab.key}
          className={[
            "entry-type-tabs__tab",
            `entry-type-tabs__tab--${tab.key}`,
            activeType === tab.key && "entry-type-tabs__tab--active",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <AppLink href={tab.href}>
            <span className="entry-type-tabs__content">
              <span className="entry-type-tabs__icon">
                <Icon name={tab.key} size={16} />
              </span>
              {tab.label}
            </span>
          </AppLink>
        </div>
      ))}
    </div>
  );
}
