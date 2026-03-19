"use client";

import "./transfer_form.scss";

import React, { useMemo, useState } from "react";

import { createTransferEntry } from "@/actions/entries";
import { MonthSelector } from "@/components/month_selector/month_selector";
import { Button, InfoBox, Input, Select } from "@/components";
import { inferEntryDateMode, toDate } from "@/lib/entry_schedule";
import { parseAmountInput, sanitizeAmountInput } from "@/lib/amount";
import { Icon, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";
import { useToast } from "@/components/toast_provider/toast_provider";

type TransferAccount = {
  id: string;
  name: string;
  currentMonthTotal: number;
};

type TransferFormInitialValues = {
  toAccountId?: string;
  description?: string;
  amount?: string;
};

type TransferFormProps = {
  accounts: TransferAccount[];
  initialValues?: TransferFormInitialValues;
  onSuccess?: () => void;
};

export function TransferForm({
  accounts,
  initialValues,
  onSuccess,
}: TransferFormProps): React.ReactElement {
  const { showError, showSuccess } = useToast();
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState(
    initialValues?.toAccountId || "",
  );
  const [description, setDescription] = useState(
    initialValues?.description || "",
  );
  const [amountInput, setAmountInput] = useState(initialValues?.amount || "");
  const [beginDate, setBeginDate] = useState(
    new Date().toISOString().slice(0, 7),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const beginDateMode = inferEntryDateMode(beginDate);

  const transferOptions = useMemo(
    () =>
      accounts.map((account) => ({
        value: account.id,
        label: account.name,
      })),
    [accounts],
  );
  const parsedAmount = parseAmountInput(amountInput);
  const selectedFromAccount = accounts.find(
    (account) => account.id === fromAccountId,
  );
  const showInsufficientFundsWarning =
    Boolean(selectedFromAccount) &&
    parsedAmount !== null &&
    parsedAmount > 0 &&
    parsedAmount > (selectedFromAccount?.currentMonthTotal || 0);

  const onSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();

    const parsedBeginDate = toDate(beginDate, beginDateMode);
    const parsedAmount = parseAmountInput(amountInput);

    if (!fromAccountId || !toAccountId || !description || !parsedBeginDate) {
      showError(i18n.t("toast.transfer_create_failed"), {
        iconName: "transfer",
      });
      return;
    }

    if (fromAccountId === toAccountId) {
      showError(i18n.t("entry_form.transfer_same_account"), {
        iconName: "transfer",
      });
      return;
    }

    if (parsedAmount === null || Math.abs(parsedAmount) === 0) {
      showError(i18n.t("entry_form.transfer_invalid_amount"), {
        iconName: "transfer",
      });
      return;
    }

    setIsSubmitting(true);

    const result = await createTransferEntry({
      fromAccountId,
      toAccountId,
      description,
      amount: Math.abs(parsedAmount),
      beginDate: parsedBeginDate,
    });

    setIsSubmitting(false);

    if (!result.success) {
      showError(i18n.t("toast.transfer_create_failed"), {
        iconName: "transfer",
      });
      return;
    }

    setFromAccountId("");
    setToAccountId("");
    setDescription("");
    setAmountInput("");
    setBeginDate(new Date().toISOString().slice(0, 7));

    showSuccess(i18n.t("toast.transfer_created"), {
      iconName: "transfer",
    });

    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <form onSubmit={onSubmit} className="transfer-form">
      <Stack gap={16}>
        <Select
          label={i18n.t("entry_form.transfer_from")}
          value={fromAccountId}
          onChange={setFromAccountId}
          options={transferOptions}
          placeholder={
            i18n.t("entry_form.transfer_account_placeholder") as string
          }
          required
        />
        {showInsufficientFundsWarning && selectedFromAccount ? (
          <InfoBox
            variant="warning"
            title={String(
              i18n.t("entry_form.transfer_insufficient_funds_title"),
            )}
            message={String(
              i18n.t("entry_form.transfer_insufficient_funds_message", {
                account: selectedFromAccount.name,
                amount: parsedAmount?.toFixed(2) || "0.00",
                balance: selectedFromAccount.currentMonthTotal.toFixed(2),
              }),
            )}
          />
        ) : null}

        <Select
          label={i18n.t("entry_form.transfer_to")}
          value={toAccountId}
          onChange={setToAccountId}
          options={transferOptions}
          placeholder={
            i18n.t("entry_form.transfer_account_placeholder") as string
          }
          required
        />

        <Input
          label={i18n.t("entry_form.description")}
          value={description}
          onChange={setDescription}
          placeholder={i18n.t("entry_form.description_placeholder") as string}
          required
        />

        <Input
          label={i18n.t("entry_form.amount")}
          value={amountInput}
          onChange={(value) => setAmountInput(sanitizeAmountInput(value))}
          placeholder={i18n.t("entry_form.amount_placeholder") as string}
          required
          inputMode="decimal"
        />

        <MonthSelector
          label={i18n.t(
            beginDateMode === "month"
              ? "entry_form.begin_date_month"
              : "entry_form.begin_date",
          )}
          value={beginDate}
          onChange={setBeginDate}
          editLabel={String(i18n.t("entry_form.edit_full_begin_date"))}
          closeLabel={String(i18n.t("entry_form.use_month_year_begin_date"))}
          monthLabel={i18n.t("entry_form.month")}
          yearLabel={i18n.t("entry_form.year")}
          required
        />

        <Text size="sm" color="secondary">
          {i18n.t("entry_form.transfer_one_time_info")}
        </Text>

        <Button
          type="submit"
          variant="transfer"
          disabled={isSubmitting}
          startIcon={<Icon name="transfer" />}
        >
          {isSubmitting
            ? i18n.t("entry_form.adding_transfer")
            : i18n.t("entry_form.add_transfer")}
        </Button>
      </Stack>
    </form>
  );
}
