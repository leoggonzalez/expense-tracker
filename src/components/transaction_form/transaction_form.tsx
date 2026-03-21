"use client";

import "./transaction_form.scss";

import {
  SpaceField,
  Button,
  Input,
  MonthSelector,
  Select,
} from "@/components";
import { CreateTransactionInput, createTransaction, updateTransaction } from "@/actions/transactions";
import {
  TransactionScheduleMode,
  deriveScheduleFromDates,
  inferTransactionDateMode,
  resolveEndDate,
  toDate,
} from "@/lib/transaction_schedule";
import { Icon, Stack, Text } from "@/elements";
import React, { useEffect, useRef, useState } from "react";
import {
  clearNewTransactionDraft,
  loadNewTransactionDraft,
  saveNewTransactionDraft,
  setNewTransactionFlowActive,
} from "@/lib/new_transaction_draft";
import { parseAmountInput, sanitizeAmountInput } from "@/lib/amount";

import { format } from "date-fns";
import { i18n } from "@/model/i18n";
import { useForm } from "react-use-form-library";
import { useToast } from "@/components/toast_provider/toast_provider";

export interface TransactionFormProps {
  spaces?: string[];
  onSuccess?: () => void;
  initialData?: {
    id: string;
    type: string;
    spaceName: string;
    description: string;
    amount: number;
    beginDate: string;
    endDate: string | null;
  };
  isEdit?: boolean;
  transactionType?: "income" | "expense";
  hideTypeField?: boolean;
}

type TransactionFormModel = {
  type: "income" | "expense";
  spaceName: string;
  description: string;
  amountInput: string;
  beginDate: string;
  scheduleMode: TransactionScheduleMode;
  installments: string;
};

function formatDateForInput(date: Date | null | undefined): string {
  if (!date) {
    return "";
  }

  return date.toISOString().split("T")[0];
}

function formatMonthForInput(date: Date | null | undefined): string {
  return formatDateForInput(date).slice(0, 7);
}

function getInitialModel(props: TransactionFormProps): TransactionFormModel {
  const type =
    (props.initialData?.type as "income" | "expense") ||
    props.transactionType ||
    "expense";
  const beginDate = props.initialData?.beginDate
    ? new Date(props.initialData.beginDate)
    : new Date();
  const endDate = props.initialData?.endDate
    ? new Date(props.initialData.endDate)
    : null;
  const schedule = deriveScheduleFromDates({ beginDate, endDate });
  const isCreateSingleTransaction = !props.isEdit && Boolean(props.transactionType);
  const defaultScheduleMode = isCreateSingleTransaction
    ? "one_time"
    : schedule.scheduleMode || "one_time";

  return {
    type,
    spaceName: props.initialData?.spaceName || "",
    description: props.initialData?.description || "",
    amountInput: props.initialData?.amount
      ? String(props.initialData.amount)
      : "",
    beginDate: formatMonthForInput(beginDate),
    scheduleMode: defaultScheduleMode,
    installments: String(schedule.installments),
  };
}

function getSubmitButtonConfig(
  isEdit: boolean,
  type: "income" | "expense",
  isSubmitting: boolean,
): {
  variant: "primary" | "danger" | "success";
  label: string;
  iconName: "income" | "expense";
} {
  if (type === "income") {
    return {
      variant: "success",
      label: String(
        i18n.t(
          isSubmitting
            ? isEdit
              ? "transaction_form.updating_income"
              : "transaction_form.adding_income"
            : isEdit
              ? "transaction_form.update_income"
              : "transaction_form.add_income",
        ),
      ),
      iconName: "income",
    };
  }

  return {
    variant: "danger",
    label: String(
      i18n.t(
        isSubmitting
          ? isEdit
            ? "transaction_form.updating_expense"
            : "transaction_form.adding_expense"
          : isEdit
            ? "transaction_form.update_expense"
            : "transaction_form.add_expense",
      ),
    ),
    iconName: "expense",
  };
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

export function TransactionForm({
  spaces: initialSpaces = [],
  onSuccess,
  initialData,
  isEdit = false,
  transactionType,
  hideTypeField = false,
}: TransactionFormProps): React.ReactElement {
  const { showError, showSuccess } = useToast();
  const [isDraftReady, setIsDraftReady] = useState(
    !(!isEdit && Boolean(transactionType)),
  );
  const hasHydratedDraftRef = useRef(false);
  const skipDraftSaveRef = useRef(false);
  const initialModelRef = useRef<TransactionFormModel>(
    getInitialModel({
      onSuccess,
      initialData,
      isEdit,
      transactionType,
      hideTypeField,
    }),
  );
  const isCreateFlow = !isEdit && Boolean(transactionType);

  function getSuccessMessageKey(
    type: TransactionFormModel["type"],
  ):
    | "toast.transaction_created"
    | "toast.income_created"
    | "toast.expense_created"
    | "toast.income_updated"
    | "toast.expense_updated" {
    if (isEdit) {
      return type === "income"
        ? "toast.income_updated"
        : "toast.expense_updated";
    }

    if (transactionType === "income") {
      return "toast.income_created";
    }

    if (transactionType === "expense") {
      return "toast.expense_created";
    }

    return "toast.transaction_created";
  }

  function getErrorMessageKey(
    type: TransactionFormModel["type"],
  ):
    | "toast.transaction_create_failed"
    | "toast.income_create_failed"
    | "toast.expense_create_failed"
    | "toast.income_update_failed"
    | "toast.expense_update_failed" {
    if (isEdit) {
      return type === "income"
        ? "toast.income_update_failed"
        : "toast.expense_update_failed";
    }

    if (transactionType === "income") {
      return "toast.income_create_failed";
    }

    if (transactionType === "expense") {
      return "toast.expense_create_failed";
    }

    return "toast.transaction_create_failed";
  }

  const form = useForm<TransactionFormModel>({
    model: initialModelRef.current,
    handleSubmit: async () => {
      const successMessageKey = getSuccessMessageKey(form.model.type);
      const errorMessageKey = getErrorMessageKey(form.model.type);
      const parsedAmount = parseAmountInput(form.model.amountInput);
      const beginDateMode = inferTransactionDateMode(form.model.beginDate);

      if (parsedAmount === null) {
        showError(i18n.t(errorMessageKey), {
          iconName: form.model.type,
        });
        return;
      }

      const beginDate =
        toDate(form.model.beginDate, beginDateMode) || new Date();
      const parsedInstallments = parseInstallments(form.model.installments);

      if (form.model.scheduleMode === "installments" && !parsedInstallments) {
        showError(i18n.t("transaction_form.invalid_installments"), {
          iconName: form.model.type,
        });
        return;
      }

      const payload: CreateTransactionInput = {
        type: isEdit ? form.model.type : transactionType || form.model.type,
        spaceName: form.model.spaceName,
        description: form.model.description,
        amount: parsedAmount,
        beginDate,
        endDate: resolveEndDate({
          scheduleMode: form.model.scheduleMode,
          beginDate,
          installments: parsedInstallments || 1,
        }),
      };

      const result =
        isEdit && initialData?.id
          ? await updateTransaction(initialData.id, payload)
          : await createTransaction(payload);

      if (!result.success) {
        showError(i18n.t(errorMessageKey), {
          iconName: form.model.type,
        });
        return;
      }

      if (!isEdit) {
        clearNewTransactionDraft();
        skipDraftSaveRef.current = true;
        reset();
      }

      showSuccess(i18n.t(successMessageKey), {
        iconName: form.model.type,
      });

      if (onSuccess) {
        onSuccess();
      }
    },
    onSubmitError: (error) => {
      const errorMessageKey = getErrorMessageKey(form.model.type);
      console.error("Error submitting form:", error);
      showError(i18n.t(errorMessageKey), {
        iconName: form.model.type,
      });
    },
  });
  const { fields, model, onSubmit, reset, submissionStatus, updateFields } =
    form;

  // eslint-disable-next-line warn-use-effect -- This effect hydrates the persisted draft once for create flows and syncs it into the form library state.
  useEffect(() => {
    if (!isCreateFlow || initialData) {
      setIsDraftReady(true);
      return;
    }

    if (hasHydratedDraftRef.current) {
      return;
    }

    setIsDraftReady(false);
    setNewTransactionFlowActive(true);

    const draft = loadNewTransactionDraft();

    if (draft) {
      updateFields({
        spaceName: draft.spaceName,
        description: draft.description,
        amountInput: draft.amountInput,
        beginDate: draft.beginDate,
        scheduleMode: draft.scheduleMode || "one_time",
        installments: draft.installments || "1",
      });
    }

    hasHydratedDraftRef.current = true;
    setIsDraftReady(true);
  }, [initialData, isCreateFlow, updateFields]);

  // eslint-disable-next-line warn-use-effect -- This effect persists draft changes to browser storage while the create flow is active.
  useEffect(() => {
    if (!isCreateFlow || !isDraftReady) {
      return;
    }

    if (skipDraftSaveRef.current) {
      skipDraftSaveRef.current = false;
      return;
    }

    saveNewTransactionDraft({
      spaceName: model.spaceName,
      description: model.description,
      amountInput: model.amountInput,
      beginDate: model.beginDate,
      beginDateMode: inferTransactionDateMode(model.beginDate),
      scheduleMode: model.scheduleMode,
      installments: model.installments,
    });
  }, [
    isCreateFlow,
    isDraftReady,
    model.spaceName,
    model.amountInput,
    model.beginDate,
    model.description,
    model.installments,
    model.scheduleMode,
  ]);

  const showTypeField = isEdit || !hideTypeField;
  const isSubmitting = submissionStatus === "submitting";
  const submitButton = getSubmitButtonConfig(isEdit, model.type, isSubmitting);

  const handleTypeChange = (value: string): void => {
    updateFields({
      type: value as TransactionFormModel["type"],
    });
  };

  const handleScheduleModeChange = (value: TransactionScheduleMode): void => {
    updateFields({
      scheduleMode: value,
      installments: value === "installments" ? model.installments || "1" : "1",
    });
  };

  const parsedInstallments = parseInstallments(model.installments);
  const beginDateMode = inferTransactionDateMode(model.beginDate);
  const beginDateForPreview = toDate(model.beginDate, beginDateMode);
  const calculatedEndDate =
    beginDateForPreview && parsedInstallments
      ? resolveEndDate({
          scheduleMode: model.scheduleMode,
          beginDate: beginDateForPreview,
          installments: parsedInstallments,
        })
      : null;

  const formattedEndDate = calculatedEndDate
    ? format(
        calculatedEndDate,
        beginDateMode === "month" ? "MMMM yyyy" : "MMM dd, yyyy",
      )
    : null;

  return (
    <form onSubmit={onSubmit} className="transaction-form">
      <Stack gap={16}>
        {showTypeField && (
          <Select
            label={i18n.t("transaction_form.type")}
            value={fields.type.value || ""}
            onChange={handleTypeChange}
            options={[
              { value: "income", label: i18n.t("common.income") },
              { value: "expense", label: i18n.t("common.expense") },
            ]}
            required
            size="lg"
            surface="subtle"
            labelTone="secondary"
          />
        )}

        <SpaceField
          label={i18n.t("transaction_form.space")}
          value={fields.spaceName.value || ""}
          onChange={(value) => fields.spaceName.onChange(value)}
          spaces={initialSpaces}
          loadSpacesOnMount={isCreateFlow && initialSpaces.length === 0}
          placeholder={i18n.t("transaction_form.space_placeholder") as string}
          required
        />

        <Input
          label={i18n.t("transaction_form.description")}
          value={fields.description.value || ""}
          onChange={(value) => fields.description.onChange(value)}
          placeholder={i18n.t("transaction_form.description_placeholder") as string}
          required
          size="lg"
          surface="subtle"
          labelTone="secondary"
        />

        <Input
          label={i18n.t("transaction_form.amount")}
          type="text"
          inputMode="decimal"
          value={fields.amountInput.value || ""}
          onChange={(value) =>
            fields.amountInput.onChange(sanitizeAmountInput(value))
          }
          placeholder={i18n.t("transaction_form.amount_placeholder") as string}
          required
          size="lg"
          surface="subtle"
          labelTone="secondary"
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
              <label key={option.value} className="transaction-form__schedule-option">
                <input
                  type="radio"
                  name="transaction-schedule"
                  checked={model.scheduleMode === option.value}
                  onChange={() => handleScheduleModeChange(option.value)}
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
          field={fields.beginDate}
          editLabel={String(i18n.t("transaction_form.edit_full_begin_date"))}
          closeLabel={String(i18n.t("transaction_form.use_month_year_begin_date"))}
          monthLabel={i18n.t("transaction_form.month")}
          yearLabel={i18n.t("transaction_form.year")}
          required
          surface="subtle"
        />

        {model.scheduleMode === "installments" && (
          <Stack gap={8}>
            <Input
              label={i18n.t("transaction_form.installments")}
              type="number"
              value={fields.installments.value || "1"}
              onChange={(value) =>
                fields.installments.onChange(sanitizeInstallmentsInput(value))
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

        <Button
          type="submit"
          disabled={isSubmitting}
          fullWidth
          variant={submitButton.variant}
          startIcon={<Icon name={submitButton.iconName} size={18} />}
        >
          {submitButton.label}
        </Button>
      </Stack>
    </form>
  );
}
