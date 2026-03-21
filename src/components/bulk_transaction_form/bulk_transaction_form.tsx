"use client";

import "./bulk_transaction_form.scss";

import {
  SpaceField,
  Button,
  Input,
  MonthSelector,
  Select,
} from "@/components";
import { CreateTransactionInput, createMultipleTransactions } from "@/actions/transactions";
import {
  TransactionScheduleMode,
  inferTransactionDateMode,
  resolveEndDate,
  toDate,
} from "@/lib/transaction_schedule";
import React, { useMemo, useRef, useState } from "react";
import { Stack, Text } from "@/elements";
import { parseAmountInput, sanitizeAmountInput } from "@/lib/amount";

import { format } from "date-fns";
import { i18n } from "@/model/i18n";
import { useToast } from "@/components/toast_provider/toast_provider";

interface BulkTransactionItem {
  id: string;
  type: "income" | "expense";
  description: string;
  amount: string;
}

export interface BulkTransactionFormProps {
  spaces?: string[];
  onSuccess?: () => void;
}

type SharedScheduleState = {
  spaceName: string;
  beginDate: string;
  scheduleMode: TransactionScheduleMode;
  installments: string;
};

function formatDateForInput(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getInitialSharedState(): SharedScheduleState {
  return {
    spaceName: "",
    beginDate: formatDateForInput(new Date()).slice(0, 7),
    scheduleMode: "one_time",
    installments: "1",
  };
}

function getInitialTransactions(): BulkTransactionItem[] {
  return [{ id: "1", type: "expense", description: "", amount: "" }];
}

function parseInstallments(value: string): number | null {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 120) {
    return null;
  }

  return parsed;
}

function sanitizeInstallmentsInput(value: string): string {
  return value.replace(/\D/g, "");
}

export function BulkTransactionForm({
  spaces: initialSpaces = [],
  onSuccess,
}: BulkTransactionFormProps): React.ReactElement {
  const { showError, showSuccess } = useToast();
  const [shared, setShared] = useState<SharedScheduleState>(
    getInitialSharedState(),
  );
  const [transactions, setTransactions] = useState<BulkTransactionItem[]>(getInitialTransactions());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nextIdRef = useRef(2);

  const beginDateMode = inferTransactionDateMode(shared.beginDate);
  const beginDate = useMemo(
    () => toDate(shared.beginDate, beginDateMode),
    [shared.beginDate, beginDateMode],
  );
  const parsedInstallments = useMemo(
    () => parseInstallments(shared.installments),
    [shared.installments],
  );
  const calculatedEndDate = useMemo(() => {
    if (
      !beginDate ||
      shared.scheduleMode !== "installments" ||
      !parsedInstallments
    ) {
      return null;
    }

    return resolveEndDate({
      scheduleMode: shared.scheduleMode,
      beginDate,
      installments: parsedInstallments,
    });
  }, [beginDate, parsedInstallments, shared.scheduleMode]);

  const formattedEndDate = calculatedEndDate
    ? format(
        calculatedEndDate,
        beginDateMode === "month" ? "MMMM yyyy" : "MMM dd, yyyy",
      )
    : null;

  const updateTransactionField = <Key extends keyof BulkTransactionItem>(
    id: string,
    field: Key,
    value: BulkTransactionItem[Key],
  ): void => {
    setTransactions((currentTransactions) =>
      currentTransactions.map((transaction) =>
        transaction.id === id ? { ...transaction, [field]: value } : transaction,
      ),
    );
  };

  const addTransaction = (): void => {
    const nextId = String(nextIdRef.current);
    nextIdRef.current += 1;

    setTransactions((currentTransactions) => [
      ...currentTransactions,
      { id: nextId, type: "expense", description: "", amount: "" },
    ]);
  };

  const removeTransaction = (id: string): void => {
    setTransactions((currentTransactions) => {
      if (currentTransactions.length <= 1) {
        return currentTransactions;
      }

      return currentTransactions.filter((transaction) => transaction.id !== id);
    });
  };

  const resetForm = (): void => {
    setShared(getInitialSharedState());
    setTransactions(getInitialTransactions());
    nextIdRef.current = 2;
  };

  const onSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();

    const parsedBeginDate = toDate(shared.beginDate, beginDateMode);
    const installments = parseInstallments(shared.installments);

    if (!shared.spaceName || !parsedBeginDate) {
      showError(i18n.t("toast.transactions_create_failed"), {
        iconName: "transactions",
      });
      return;
    }

    if (shared.scheduleMode === "installments" && !installments) {
      showError(i18n.t("transaction_form.invalid_installments"), {
        iconName: "transactions",
      });
      return;
    }

    const payloadEndDate = resolveEndDate({
      scheduleMode: shared.scheduleMode,
      beginDate: parsedBeginDate,
      installments: installments || 1,
    });

    const inputs: CreateTransactionInput[] = [];

    for (const transaction of transactions) {
      const parsedAmount = parseAmountInput(transaction.amount);

      if (!transaction.description || parsedAmount === null) {
        showError(i18n.t("toast.transactions_create_failed"), {
          iconName: "transactions",
        });
        return;
      }

      inputs.push({
        type: transaction.type,
        spaceName: shared.spaceName,
        description: transaction.description,
        amount: parsedAmount,
        beginDate: parsedBeginDate,
        endDate: payloadEndDate,
      });
    }

    setIsSubmitting(true);
    const result = await createMultipleTransactions(inputs);
    setIsSubmitting(false);

    if (!result.success) {
      showError(i18n.t("toast.transactions_create_failed"), {
        iconName: "transactions",
      });
      return;
    }

    showSuccess(i18n.t("toast.transactions_created"), {
      iconName: "transactions",
    });
    resetForm();

    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <form onSubmit={onSubmit} className="bulk-transaction-form">
      <Stack gap={24}>
        <Text size="h4" weight="semibold">
          {i18n.t("bulk_transaction_form.title")}
        </Text>

        <Stack gap={16}>
          <SpaceField
            label={i18n.t("bulk_transaction_form.shared_space")}
            value={shared.spaceName}
            onChange={(value) =>
              setShared((current) => ({ ...current, spaceName: value }))
            }
            spaces={initialSpaces}
            loadSpacesOnMount={initialSpaces.length === 0}
            placeholder={
              i18n.t("bulk_transaction_form.shared_space_placeholder") as string
            }
            required
          />

          <Stack gap={4}>
            <Text size="sm" weight="medium" color="secondary">
              {i18n.t("transaction_form.schedule_label")}
            </Text>

            <Stack direction="row" wrap gap={12}>
              {(
                [
                  {
                    value: "one_time",
                    label: i18n.t("transaction_form.schedule_one_time"),
                  },
                  {
                    value: "installments",
                    label: i18n.t("transaction_form.schedule_installments"),
                  },
                  {
                    value: "unlimited",
                    label: i18n.t("transaction_form.schedule_unlimited"),
                  },
                ] as const
              ).map((option) => (
                <label
                  key={option.value}
                  className="bulk-transaction-form__schedule-option"
                >
                  <input
                    type="radio"
                    name="bulk-transaction-schedule"
                    checked={shared.scheduleMode === option.value}
                    onChange={() =>
                      setShared((current) => ({
                        ...current,
                        scheduleMode: option.value,
                        installments:
                          option.value === "installments"
                            ? current.installments || "1"
                            : "1",
                      }))
                    }
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </Stack>
          </Stack>

          <MonthSelector
            label={i18n.t(
              beginDateMode === "month"
                ? "transaction_form.begin_date_month"
                : "transaction_form.begin_date",
            )}
            value={shared.beginDate}
            onChange={(value) =>
              setShared((current) => ({ ...current, beginDate: value }))
            }
            editLabel={String(i18n.t("transaction_form.edit_full_begin_date"))}
            closeLabel={String(i18n.t("transaction_form.use_month_year_begin_date"))}
            monthLabel={i18n.t("transaction_form.month")}
            yearLabel={i18n.t("transaction_form.year")}
            required
            surface="subtle"
          />

          {shared.scheduleMode === "installments" && (
            <Stack gap={8}>
              <Input
                label={i18n.t("transaction_form.installments")}
                type="number"
                value={shared.installments}
                onChange={(value) =>
                  setShared((current) => ({
                    ...current,
                    installments: sanitizeInstallmentsInput(value),
                  }))
                }
                min={1}
                max={120}
                step={1}
                required
                size="lg"
                surface="subtle"
                labelTone="secondary"
              />

              {formattedEndDate && (
                <Text size="sm" color="secondary">
                  {i18n.t("transaction_form.calculated_end_date", {
                    endDate: formattedEndDate,
                  })}
                </Text>
              )}
            </Stack>
          )}
        </Stack>

        <div className="bulk-transaction-form__transactions">
          <Text size="sm" weight="semibold" color="secondary">
            {i18n.t("bulk_transaction_form.transactions")}
          </Text>
          <Stack gap={12}>
            {transactions.map((transaction) => (
              <Stack
                direction="row"
                wrap
                gap={12}
                align="center"
                justify="space-between"
                key={transaction.id}
              >
                <Stack direction="row" wrap gap={12} align="center">
                  <Select
                    value={transaction.type}
                    onChange={(value) =>
                      updateTransactionField(
                        transaction.id,
                        "type",
                        value as BulkTransactionItem["type"],
                      )
                    }
                    options={[
                      {
                        value: "income",
                        label: i18n.t("common.income"),
                      },
                      {
                        value: "expense",
                        label: i18n.t("common.expense"),
                      },
                    ]}
                    size="lg"
                    surface="subtle"
                  />

                  <Input
                    value={transaction.description}
                    onChange={(value) =>
                      updateTransactionField(transaction.id, "description", value)
                    }
                    placeholder={
                      i18n.t(
                        "bulk_transaction_form.description_placeholder",
                      ) as string
                    }
                    required
                    size="lg"
                    surface="subtle"
                  />

                  <Input
                    type="text"
                    inputMode="decimal"
                    value={transaction.amount}
                    onChange={(value) =>
                      updateTransactionField(
                        transaction.id,
                        "amount",
                        sanitizeAmountInput(value),
                      )
                    }
                    placeholder={
                      i18n.t("bulk_transaction_form.amount_placeholder") as string
                    }
                    required
                    size="lg"
                    surface="subtle"
                  />
                </Stack>

                {transactions.length > 1 && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => removeTransaction(transaction.id)}
                  >
                    {i18n.t("bulk_transaction_form.remove")}
                  </Button>
                )}
              </Stack>
            ))}
          </Stack>

          <Button type="button" variant="secondary" onClick={addTransaction}>
            {i18n.t("bulk_transaction_form.add_another_transaction")}
          </Button>
        </div>

        <Button type="submit" disabled={isSubmitting} fullWidth>
          {isSubmitting
            ? i18n.t("bulk_transaction_form.add_transactions_loading")
            : i18n.t(
                transactions.length === 1
                  ? "bulk_transaction_form.add_transactions_one"
                  : "bulk_transaction_form.add_transactions_other",
                { count: transactions.length },
              )}
        </Button>
      </Stack>
    </form>
  );
}
