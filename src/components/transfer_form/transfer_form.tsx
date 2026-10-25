"use client";

import "@/components/transfer_form/transfer_form.scss";

import React, { useState } from "react";

import { createTransferTransaction } from "@/actions/transactions";
import { Button, InfoBox, Input, Select } from "@/components";
import { format } from "date-fns";
import { useToast } from "@/components/toast_provider/toast_provider";
import { Icon, Stack, Text } from "@/elements";
import { parseAmountInput, sanitizeAmountInput } from "@/lib/amount";
import { triggerNewTransactionRecentRefresh } from "@/lib/new_transaction_recent_refresh";
import { inferTransactionDateMode, toDate } from "@/lib/transaction_schedule";
import { i18n } from "@/model/i18n";

type TransferSpace = {
  id: string;
  name: string;
  currentMonthTotal: number;
};

type TransferFormInitialValues = {
  fromSpaceId?: string;
  toSpaceId?: string;
  description?: string;
  amount?: string;
};

interface TransferFormProps {
  spaces: TransferSpace[];
  initialValues?: TransferFormInitialValues;
  onSuccess?: () => void;
  fixedFromSpaceId?: string;
}

export function TransferForm({
  spaces,
  initialValues,
  onSuccess,
  fixedFromSpaceId,
}: TransferFormProps): React.ReactElement {
  const { showError, showSuccess } = useToast();
  const [fromSpaceId, setFromSpaceId] = useState(
    fixedFromSpaceId || initialValues?.fromSpaceId || "",
  );
  const [toSpaceId, setToSpaceId] = useState(initialValues?.toSpaceId || "");
  const [description, setDescription] = useState(
    initialValues?.description || "",
  );
  const [amountInput, setAmountInput] = useState(initialValues?.amount || "");
  const [beginDate, setBeginDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const beginDateMode = inferTransactionDateMode(beginDate);

  const transferOptions = spaces.map((space) => ({
    value: space.id,
    label: space.name,
  }));
  const parsedAmount = parseAmountInput(amountInput);
  const selectedFromSpace = spaces.find((space) => space.id === fromSpaceId);
  const showInsufficientFundsWarning =
    Boolean(selectedFromSpace) &&
    parsedAmount !== null &&
    parsedAmount > 0 &&
    parsedAmount > (selectedFromSpace?.currentMonthTotal || 0);

  const onSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();

    const parsedBeginDate = toDate(beginDate, beginDateMode);
    const parsedAmount = parseAmountInput(amountInput);

    if (!fromSpaceId || !toSpaceId || !description || !parsedBeginDate) {
      showError(i18n.t("toast.transfer_create_failed"), {
        iconName: "transfer",
      });
      return;
    }

    if (fromSpaceId === toSpaceId) {
      showError(i18n.t("transaction_form.transfer_same_space"), {
        iconName: "transfer",
      });
      return;
    }

    if (parsedAmount === null || Math.abs(parsedAmount) === 0) {
      showError(i18n.t("transaction_form.transfer_invalid_amount"), {
        iconName: "transfer",
      });
      return;
    }

    setIsSubmitting(true);

    const result = await createTransferTransaction({
      fromSpaceId: fixedFromSpaceId || fromSpaceId,
      toSpaceId,
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

    setFromSpaceId(fixedFromSpaceId || "");
    setToSpaceId("");
    setDescription("");
    setAmountInput("");
    setBeginDate(format(new Date(), "yyyy-MM-dd"));

    showSuccess(i18n.t("toast.transfer_created"), {
      iconName: "transfer",
    });
    triggerNewTransactionRecentRefresh();

    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <form onSubmit={onSubmit} className="transfer-form">
      <Stack gap={16}>
        {!fixedFromSpaceId && (
          <Select
            label={i18n.t("transaction_form.transfer_from")}
            value={fromSpaceId}
            onChange={setFromSpaceId}
            options={transferOptions}
            placeholder={
              i18n.t("transaction_form.transfer_space_placeholder") as string
            }
            required
            size="lg"
            surface="subtle"
            labelTone="secondary"
          />
        )}
        {showInsufficientFundsWarning && selectedFromSpace ? (
          <InfoBox
            variant="warning"
            accent="primary"
            radius="xl"
            title={String(
              i18n.t("transaction_form.transfer_insufficient_funds_title"),
            )}
            message={String(
              i18n.t("transaction_form.transfer_insufficient_funds_message", {
                space: selectedFromSpace.name,
                amount: parsedAmount?.toFixed(2) || "0.00",
                balance: selectedFromSpace.currentMonthTotal.toFixed(2),
              }),
            )}
          />
        ) : null}

        <Select
          label={i18n.t("transaction_form.transfer_to")}
          value={toSpaceId}
          onChange={setToSpaceId}
          options={transferOptions.filter(
            (option) => option.value !== (fixedFromSpaceId || fromSpaceId),
          )}
          placeholder={
            i18n.t("transaction_form.transfer_space_placeholder") as string
          }
          required
          size="lg"
          surface="subtle"
          labelTone="secondary"
        />

        <Input
          label={i18n.t("transaction_form.description")}
          value={description}
          onChange={setDescription}
          placeholder={
            i18n.t("transaction_form.description_placeholder") as string
          }
          required
          size="lg"
          surface="subtle"
          labelTone="secondary"
        />

        <Input
          label={i18n.t("transaction_form.amount")}
          value={amountInput}
          onChange={(value) => setAmountInput(sanitizeAmountInput(value))}
          placeholder={i18n.t("transaction_form.amount_placeholder") as string}
          required
          inputMode="decimal"
          size="lg"
          surface="subtle"
          labelTone="secondary"
        />

        <Input
          type="date"
          label={i18n.t("transaction_form.begin_date")}
          value={beginDate}
          onChange={setBeginDate}
          required
          size="lg"
          surface="subtle"
          labelTone="secondary"
        />

        <Text element="p" type="caption" color="secondary">
          {i18n.t("transaction_form.transfer_one_time_info")}
        </Text>

        <Button
          type="submit"
          variant="outline-transfer"
          disabled={isSubmitting}
          startIcon={<Icon name="transfer" size={18} />}
        >
          {isSubmitting
            ? i18n.t("transaction_form.adding_transfer")
            : i18n.t("transaction_form.add_transfer")}
        </Button>
      </Stack>
    </form>
  );
}
