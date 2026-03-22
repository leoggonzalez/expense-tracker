import "./transaction_card.scss";

import React from "react";

import { Avatar, Currency } from "@/components";
import { Box, Stack, Text } from "@/elements";
import { format } from "date-fns";
import { i18n } from "@/model/i18n";

export type TransactionCardItem = {
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

type TransactionCardProps = {
  transaction: TransactionCardItem;
};

function getTransferDirectionLabel(
  transaction: TransactionCardItem,
): string | null {
  if (!transaction.transferSpaceId || !transaction.transferSpaceName) {
    return null;
  }

  if (transaction.amount < 0) {
    return String(
      i18n.t("transaction_list.to_space", {
        space: transaction.transferSpaceName,
      }),
    );
  }

  return String(
    i18n.t("transaction_list.from_space", {
      space: transaction.transferSpaceName,
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

export function TransactionCard({
  transaction,
}: TransactionCardProps): React.ReactElement {
  const transferDirectionLabel = getTransferDirectionLabel(transaction);

  return (
    <div className="transaction-card">
      <Box
        padding={{
          paddingTop: 16,
          paddingRight: 16,
          paddingBottom: 16,
          paddingLeft: 16,
        }}
      >
        <div className="transaction-card__layout">
          <div className="transaction-card__space">
            <Avatar name={transaction.spaceName} />
          </div>
          <div className="transaction-card__details">
            <Stack gap={4}>
              <div className="transaction-card__detail-line">
                <Text size="sm" weight="semibold">
                  {transaction.description}
                </Text>
              </div>
              {transferDirectionLabel ? (
                <div className="transaction-card__detail-line">
                  <Text size="xs" color="secondary">
                    {transferDirectionLabel}
                  </Text>
                </div>
              ) : null}
              <div className="transaction-card__detail-line">
                <Text size="xs" color="secondary">
                  {formatDateLine(transaction.beginDate, transaction.endDate)}
                </Text>
              </div>
            </Stack>
          </div>
          <div className="transaction-card__amount">
            <Currency value={transaction.amount} size="sm" weight="bold" />
          </div>
        </div>
      </Box>
    </div>
  );
}
