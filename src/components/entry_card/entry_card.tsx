import "./entry_card.scss";

import React from "react";

import { Avatar, Currency } from "@/components";
import { Text } from "@/elements";
import { format } from "date-fns";
import { i18n } from "@/model/i18n";

export type EntryCardItem = {
  id: string;
  type: string;
  spaceName: string;
  description: string;
  amount: number;
  beginDate: string;
  endDate: string | null;
  transferSpaceId?: string | null;
  transferSpaceName?: string | null;
};

type EntryCardProps = {
  entry: EntryCardItem;
};

function getTransferDirectionLabel(entry: EntryCardItem): string | null {
  if (!entry.transferSpaceId || !entry.transferSpaceName) {
    return null;
  }

  if (entry.amount < 0) {
    return String(
      i18n.t("entry_list.to_space", {
        space: entry.transferSpaceName,
      }),
    );
  }

  return String(
    i18n.t("entry_list.from_space", {
      space: entry.transferSpaceName,
    }),
  );
}

function formatDateLine(beginDate: string, endDate: string | null): string {
  const formattedBegin = format(new Date(beginDate), "MMM dd, yyyy");

  if (!endDate) {
    return formattedBegin;
  }

  const beginTime = new Date(beginDate).getTime();
  const endTime = new Date(endDate).getTime();

  if (beginTime === endTime) {
    return formattedBegin;
  }

  return `${formattedBegin} - ${format(new Date(endDate), "MMM dd, yyyy")}`;
}

export function EntryCard({ entry }: EntryCardProps): React.ReactElement {
  const transferDirectionLabel = getTransferDirectionLabel(entry);

  return (
    <div className="entry-card">
      <div className="entry-card__space">
        <Avatar name={entry.spaceName} />
      </div>
      <div className="entry-card__details">
        <div className="entry-card__detail-line">
          <Text size="sm" weight="semibold">
            {entry.description}
          </Text>
        </div>
        {transferDirectionLabel ? (
          <div className="entry-card__detail-line">
            <Text size="xs" color="secondary">
              {transferDirectionLabel}
            </Text>
          </div>
        ) : null}
        <div className="entry-card__detail-line">
          <Text size="xs" color="secondary">
            {formatDateLine(entry.beginDate, entry.endDate)}
          </Text>
        </div>
      </div>
      <div className="entry-card__amount">
        <Currency value={entry.amount} size="sm" weight="bold" />
      </div>
    </div>
  );
}
