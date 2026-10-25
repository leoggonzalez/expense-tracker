"use client";

import React from "react";

import { Checkbox, Currency } from "@/components";
import { Stack, Text } from "@/elements";
import { getSplitShareCents } from "@/lib/transaction_split";
import type { SplitMember } from "@/lib/transaction_split";
import { i18n } from "@/model/i18n";

interface TransactionSplitProps {
  ownerId: string;
  members: SplitMember[];
  selectedIds: string[];
  amount: number;
  disabled: boolean;
  onChange: (ids: string[]) => void;
}

export function TransactionSplit({
  ownerId,
  members,
  selectedIds,
  amount,
  disabled,
  onChange,
}: TransactionSplitProps): React.ReactElement {
  const participants = [
    {
      id: ownerId,
      name: String(i18n.t("transaction_split.you")),
      isRemoved: false,
    },
    ...members,
  ];
  return (
    <Stack gap={12}>
      <Text element="h2" type="body-medium">
        {i18n.t("transaction_split.title")}
      </Text>
      {participants.map((participant) => {
        const checked = selectedIds.includes(participant.id);
        return (
          <Stack
            key={participant.id}
            line
            align="center"
            justify="space-between"
            gap={12}
          >
            <Checkbox
              checked={checked}
              disabled={disabled}
              label={
                participant.isRemoved
                  ? i18n.t("space_members.former", { name: participant.name })
                  : participant.name
              }
              onChange={(next) =>
                onChange(
                  next
                    ? [...selectedIds, participant.id]
                    : selectedIds.filter((id) => id !== participant.id),
                )
              }
            />
            <Currency
              value={
                checked
                  ? getSplitShareCents(Math.abs(amount), selectedIds.length) /
                    100
                  : 0
              }
              color="primary"
            />
          </Stack>
        );
      })}
      {!selectedIds.length ? (
        <Text element="p" type="caption" color="danger">
          {i18n.t("transaction_split.select_participant")}
        </Text>
      ) : null}
    </Stack>
  );
}
