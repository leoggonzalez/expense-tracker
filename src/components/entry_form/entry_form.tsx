"use client";

import "./entry_form.scss";

import {
  AccountField,
  Button,
  Input,
  MonthSelector,
  Select,
} from "@/components";
import { CreateEntryInput, createEntry, updateEntry } from "@/actions/entries";
import {
  EntryDateMode,
  EntryScheduleMode,
  deriveScheduleFromDates,
  normalizeDateValue,
  resolveEndDate,
  toDate,
} from "@/lib/entry_schedule";
import { Icon, Stack, Text } from "@/elements";
import React, { useEffect, useRef, useState } from "react";
import {
  clearNewEntryDraft,
  loadNewEntryDraft,
  saveNewEntryDraft,
  setNewEntryFlowActive,
} from "@/lib/new_entry_draft";
import { parseAmountInput, sanitizeAmountInput } from "@/lib/amount";

import { format } from "date-fns";
import { i18n } from "@/model/i18n";
import { useForm } from "react-use-form-library";
import { useToast } from "@/components/toast_provider/toast_provider";

export interface EntryFormProps {
  accounts?: string[];
  onSuccess?: () => void;
  initialData?: {
    id: string;
    type: string;
    accountName: string;
    description: string;
    amount: number;
    beginDate: string;
    endDate: string | null;
  };
  isEdit?: boolean;
  entryType?: "income" | "expense";
  hideTypeField?: boolean;
}

type EntryFormModel = {
  type: "income" | "expense";
  accountName: string;
  description: string;
  amountInput: string;
  beginDate: string;
  beginDateMode: EntryDateMode;
  scheduleMode: EntryScheduleMode;
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

function getInitialModel(props: EntryFormProps): EntryFormModel {
  const type =
    (props.initialData?.type as "income" | "expense") ||
    props.entryType ||
    "expense";
  const beginDate = props.initialData?.beginDate
    ? new Date(props.initialData.beginDate)
    : new Date();
  const endDate = props.initialData?.endDate
    ? new Date(props.initialData.endDate)
    : null;
  const schedule = deriveScheduleFromDates({ beginDate, endDate });

  return {
    type,
    accountName: props.initialData?.accountName || "",
    description: props.initialData?.description || "",
    amountInput: props.initialData?.amount
      ? String(props.initialData.amount)
      : "",
    beginDate: formatMonthForInput(beginDate),
    beginDateMode: "month",
    scheduleMode: schedule.scheduleMode || "one_time",
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
              ? "entry_form.updating_income"
              : "entry_form.adding_income"
            : isEdit
              ? "entry_form.update_income"
              : "entry_form.add_income",
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
            ? "entry_form.updating_expense"
            : "entry_form.adding_expense"
          : isEdit
            ? "entry_form.update_expense"
            : "entry_form.add_expense",
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

export function EntryForm({
  accounts: initialAccounts = [],
  onSuccess,
  initialData,
  isEdit = false,
  entryType,
  hideTypeField = false,
}: EntryFormProps): React.ReactElement {
  const { showError, showSuccess } = useToast();
  const [isDraftReady, setIsDraftReady] = useState(
    !(!isEdit && Boolean(entryType)),
  );
  const hasHydratedDraftRef = useRef(false);
  const skipDraftSaveRef = useRef(false);
  const initialModelRef = useRef<EntryFormModel>(
    getInitialModel({
      onSuccess,
      initialData,
      isEdit,
      entryType,
      hideTypeField,
    }),
  );
  const isCreateFlow = !isEdit && Boolean(entryType);
  const successMessageKey =
    entryType === "income"
      ? "toast.income_created"
      : entryType === "expense"
        ? "toast.expense_created"
        : "toast.entry_created";
  const errorMessageKey =
    entryType === "income"
      ? "toast.income_create_failed"
      : entryType === "expense"
        ? "toast.expense_create_failed"
        : "toast.entry_create_failed";

  const form = useForm<EntryFormModel>({
    model: initialModelRef.current,
    handleSubmit: async () => {
      const parsedAmount = parseAmountInput(form.model.amountInput);

      if (parsedAmount === null) {
        if (!isEdit) {
          showError(i18n.t(errorMessageKey), {
            iconName: form.model.type,
          });
        }
        return;
      }

      const beginDate =
        toDate(form.model.beginDate, form.model.beginDateMode) || new Date();
      const parsedInstallments = parseInstallments(form.model.installments);

      if (form.model.scheduleMode === "installments" && !parsedInstallments) {
        if (!isEdit) {
          showError(i18n.t("entry_form.invalid_installments"), {
            iconName: form.model.type,
          });
        }
        return;
      }

      const payload: CreateEntryInput = {
        type: isEdit ? form.model.type : entryType || form.model.type,
        accountName: form.model.accountName,
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
          ? await updateEntry(initialData.id, payload)
          : await createEntry(payload);

      if (!result.success) {
        if (!isEdit) {
          showError(i18n.t(errorMessageKey), {
            iconName: form.model.type,
          });
        }
        return;
      }

      if (!isEdit) {
        clearNewEntryDraft();
        skipDraftSaveRef.current = true;
        reset();
        showSuccess(i18n.t(successMessageKey), {
          iconName: form.model.type,
        });
      }

      if (onSuccess) {
        onSuccess();
      }
    },
    onSubmitError: (error) => {
      console.error("Error submitting form:", error);
      if (!isEdit) {
        showError(i18n.t(errorMessageKey), {
          iconName: form.model.type,
        });
      }
    },
  });
  const { fields, model, onSubmit, reset, submissionStatus, updateFields } =
    form;

  useEffect(() => {
    if (!isCreateFlow || initialData) {
      setIsDraftReady(true);
      return;
    }

    if (hasHydratedDraftRef.current) {
      return;
    }

    setIsDraftReady(false);
    setNewEntryFlowActive(true);

    const draft = loadNewEntryDraft();

    if (draft) {
      updateFields({
        accountName: draft.accountName,
        description: draft.description,
        amountInput: draft.amountInput,
        beginDate: draft.beginDate,
        beginDateMode: draft.beginDateMode,
        scheduleMode: draft.scheduleMode || "one_time",
        installments: draft.installments || "1",
      });
    }

    hasHydratedDraftRef.current = true;
    setIsDraftReady(true);
  }, [initialData, isCreateFlow, updateFields]);

  useEffect(() => {
    if (!isCreateFlow || !isDraftReady) {
      return;
    }

    if (skipDraftSaveRef.current) {
      skipDraftSaveRef.current = false;
      return;
    }

    saveNewEntryDraft({
      accountName: model.accountName,
      description: model.description,
      amountInput: model.amountInput,
      beginDate: model.beginDate,
      beginDateMode: model.beginDateMode,
      scheduleMode: model.scheduleMode,
      installments: model.installments,
    });
  }, [
    isCreateFlow,
    isDraftReady,
    model.accountName,
    model.amountInput,
    model.beginDate,
    model.beginDateMode,
    model.description,
    model.installments,
    model.scheduleMode,
  ]);

  const showTypeField = isEdit || !hideTypeField;
  const isSubmitting = submissionStatus === "submitting";
  const submitButton = getSubmitButtonConfig(isEdit, model.type, isSubmitting);

  const handleTypeChange = (value: string): void => {
    updateFields({
      type: value as EntryFormModel["type"],
    });
  };

  const handleBeginDateChange = (value: string): void => {
    updateFields({
      beginDate: value,
    });
  };

  const handleBeginDateModeChange = (): void => {
    updateFields({
      beginDateMode: "date",
      beginDate: normalizeDateValue(model.beginDate, model.beginDateMode),
    });
  };

  const handleScheduleModeChange = (value: EntryScheduleMode): void => {
    updateFields({
      scheduleMode: value,
      installments: value === "installments" ? model.installments || "1" : "1",
    });
  };

  const parsedInstallments = parseInstallments(model.installments);
  const beginDateForPreview = toDate(model.beginDate, model.beginDateMode);
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
        model.beginDateMode === "month" ? "MMMM yyyy" : "MMM dd, yyyy",
      )
    : null;

  return (
    <form onSubmit={onSubmit} className="entry-form">
      <Stack gap={16}>
        {showTypeField && (
          <Select
            label={i18n.t("entry_form.type")}
            value={fields.type.value || ""}
            onChange={handleTypeChange}
            options={[
              { value: "income", label: i18n.t("common.income") },
              { value: "expense", label: i18n.t("common.expense") },
            ]}
            required
          />
        )}

        <AccountField
          label={i18n.t("entry_form.account")}
          value={fields.accountName.value || ""}
          onChange={(value) => fields.accountName.onChange(value)}
          accounts={initialAccounts}
          placeholder={i18n.t("entry_form.account_placeholder") as string}
          required
        />

        <Input
          label={i18n.t("entry_form.description")}
          value={fields.description.value || ""}
          onChange={(value) => fields.description.onChange(value)}
          placeholder={i18n.t("entry_form.description_placeholder") as string}
          required
        />

        <Input
          label={i18n.t("entry_form.amount")}
          type="text"
          inputMode="decimal"
          value={fields.amountInput.value || ""}
          onChange={(value) =>
            fields.amountInput.onChange(sanitizeAmountInput(value))
          }
          placeholder={i18n.t("entry_form.amount_placeholder") as string}
          required
        />

        <Stack gap={4}>
          <Text size="sm" weight="medium">
            {i18n.t("entry_form.schedule_label")}
          </Text>

          <Stack direction="row" wrap gap={12}>
            {(
              [
                {
                  value: "one_time",
                  label: i18n.t("entry_form.schedule_one_time"),
                },
                {
                  value: "installments",
                  label: i18n.t("entry_form.schedule_installments"),
                },
                {
                  value: "unlimited",
                  label: i18n.t("entry_form.schedule_unlimited"),
                },
              ] as const
            ).map((option) => (
              <label key={option.value} className="entry-form__schedule-option">
                <input
                  type="radio"
                  name="entry-schedule"
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
            model.beginDateMode === "month"
              ? "entry_form.begin_date_month"
              : "entry_form.begin_date",
          )}
          mode={model.beginDateMode}
          value={fields.beginDate.value || ""}
          onChange={handleBeginDateChange}
          onEnableFullDate={handleBeginDateModeChange}
          editLabel={String(i18n.t("entry_form.edit_full_begin_date"))}
          monthLabel={i18n.t("entry_form.month")}
          yearLabel={i18n.t("entry_form.year")}
          required
        />

        {model.scheduleMode === "installments" && (
          <Stack gap={8}>
            <Input
              label={i18n.t("entry_form.installments")}
              type="number"
              value={fields.installments.value || "1"}
              onChange={(value) =>
                fields.installments.onChange(sanitizeInstallmentsInput(value))
              }
              min={1}
              max={120}
              step={1}
              required
            />

            {formattedEndDate && (
              <Text size="sm" color="secondary">
                {i18n.t("entry_form.calculated_end_date", {
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
