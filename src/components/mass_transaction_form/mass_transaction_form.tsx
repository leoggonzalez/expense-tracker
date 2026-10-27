"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { updateMassTransactions } from "@/actions/mass_transactions";
import { Button, Input, Select } from "@/components";
import { useToast } from "@/components/toast_provider/toast_provider";
import { Icon, Stack, Text } from "@/elements";
import { parseAmountInput, sanitizeAmountInput } from "@/lib/amount";
import type { MassEditTransaction } from "@/lib/mass_transaction_edit";
import { parseSplitParticipants } from "@/lib/transaction_split";
import { i18n } from "@/model/i18n";
import "@/components/mass_transaction_form/mass_transaction_form.scss";

interface MassTransactionFormProps {
  transactions: MassEditTransaction[];
  spaces: { id: string; name: string }[];
  ownerId: string;
  backHref: string;
}

export function MassTransactionForm({
  transactions,
  spaces,
  ownerId,
  backHref,
}: MassTransactionFormProps): React.ReactElement {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [type, setType] = useState(
    transactions.every((row) => row.type === transactions[0].type)
      ? transactions[0].type
      : "",
  );
  const [spaceId, setSpaceId] = useState(
    transactions.every((row) => row.spaceId === transactions[0].spaceId)
      ? transactions[0].spaceId
      : "",
  );
  const [rows, setRows] = useState(() =>
    transactions.map((row) => ({
      id: row.id,
      description: row.description,
      amount: String(Math.abs(row.amount)),
      date: format(new Date(row.beginDate), "yyyy-MM-dd"),
      updatedAt: row.updatedAt,
    })),
  );
  const [isSaving, setIsSaving] = useState(false);
  const sharedWithMembers = transactions.some((row) =>
    parseSplitParticipants(row.splitParticipantIds).some(
      (id) => id !== ownerId,
    ),
  );
  const availableSpaces = sharedWithMembers
    ? spaces.filter((space) => space.id === transactions[0].spaceId)
    : spaces;
  function changeRow(
    id: string,
    field: "description" | "amount" | "date",
    value: string,
  ): void {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  }
  async function submit(): Promise<void> {
    if (isSaving) return;
    const updates = rows.map((row) => ({
      id: row.id,
      description: row.description,
      amount: parseAmountInput(row.amount) ?? Number.NaN,
      beginDate: row.date,
      updatedAt: row.updatedAt,
    }));
    if (
      updates.some(
        (row) =>
          !row.description.trim() ||
          !Number.isFinite(row.amount) ||
          row.amount <= 0 ||
          !row.beginDate,
      )
    ) {
      showError(i18n.t("mass_edit.invalid_fields"));
      return;
    }
    setIsSaving(true);
    try {
      const result = await updateMassTransactions({
        ...(type ? { type: type as "income" | "expense" } : {}),
        ...(spaceId ? { spaceId } : {}),
        transactions: updates,
      });
      if (!result.success) {
        showError(i18n.t(result.error || "mass_edit.failed"));
        return;
      }
      showSuccess(i18n.t("mass_edit.success"));
      router.push(backHref);
      router.refresh();
    } catch {
      showError(i18n.t("mass_edit.failed"));
    } finally {
      setIsSaving(false);
    }
  }
  return (
    <form className="mass-transaction-form" action={submit}>
      <fieldset className="mass-transaction-form__fields" disabled={isSaving}>
        <Stack gap={24}>
          <Select
            label={i18n.t("mass_edit.type")}
            value={type}
            onChange={setType}
            options={[
              { value: "", label: i18n.t("mass_edit.keep_type") },
              { value: "income", label: i18n.t("common.income") },
              { value: "expense", label: i18n.t("common.expense") },
            ]}
          />
          <Select
            label={i18n.t("mass_edit.space")}
            value={spaceId}
            onChange={setSpaceId}
            options={[
              ...(!sharedWithMembers
                ? [{ value: "", label: i18n.t("mass_edit.keep_space") }]
                : []),
              ...availableSpaces.map((space) => ({
                value: space.id,
                label: space.name,
              })),
            ]}
          />
          {sharedWithMembers ? (
            <Text element="p" type="caption" color="secondary">
              {i18n.t("mass_edit.shared_space")}
            </Text>
          ) : null}
          <Text element="p" type="caption" color="secondary">
            {i18n.t("mass_edit.schedule_hint")}
          </Text>
          <Text element="p" type="caption" color="secondary">
            {i18n.t("mass_edit.category_preserved")}
          </Text>
          <Stack gap={12}>
            {rows.map((row, index) => (
              <fieldset
                key={row.id}
                className="mass-transaction-form__row"
                aria-label={String(
                  i18n.t("mass_edit.row", { number: index + 1 }),
                )}
              >
                <Input
                  label={
                    index === 0 ? i18n.t("mass_edit.description") : undefined
                  }
                  ariaLabel={String(i18n.t("mass_edit.description"))}
                  value={row.description}
                  onChange={(value) => changeRow(row.id, "description", value)}
                  required
                />
                <Input
                  label={index === 0 ? i18n.t("mass_edit.amount") : undefined}
                  ariaLabel={String(i18n.t("mass_edit.amount"))}
                  value={row.amount}
                  onChange={(value) =>
                    changeRow(row.id, "amount", sanitizeAmountInput(value))
                  }
                  inputMode="decimal"
                  required
                />
                <Input
                  label={index === 0 ? i18n.t("mass_edit.date") : undefined}
                  ariaLabel={String(i18n.t("mass_edit.date"))}
                  value={row.date}
                  onChange={(value) => changeRow(row.id, "date", value)}
                  type="date"
                  required
                />
              </fieldset>
            ))}
          </Stack>
          <Button
            type="submit"
            disabled={isSaving}
            fullWidth
            variant={
              type === "expense"
                ? "danger"
                : type === "income"
                  ? "outline-success"
                  : "primary"
            }
            startIcon={
              <Icon
                name={
                  type === "income"
                    ? "income"
                    : type === "expense"
                      ? "expense"
                      : "edit"
                }
                size={18}
              />
            }
          >
            {i18n.t(isSaving ? "mass_edit.saving" : "mass_edit.save")}
          </Button>
        </Stack>
      </fieldset>
    </form>
  );
}
