"use client";

import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-use-form-library";

import { Stack, Icon } from "@/elements";
import { AccountField, Button, Checkbox, Input, Select } from "@/components";
import {
  clearNewEntryDraft,
  loadNewEntryDraft,
  saveNewEntryDraft,
  setNewEntryFlowActive,
} from "@/lib/new_entry_draft";
import {
  EntryDateField,
  EntryDateFieldMode,
} from "@/components/entry_date_field/entry_date_field";
import { parseAmountInput, sanitizeAmountInput } from "@/lib/amount";
import { createEntry, CreateEntryInput, updateEntry } from "@/actions/entries";
import { useToast } from "@/components/toast_provider/toast_provider";
import { i18n } from "@/model/i18n";
import "./entry_form.scss";

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
  endDate: string;
  isRecurring: boolean;
  beginDateMode: EntryDateFieldMode;
  endDateMode: EntryDateFieldMode;
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

function normalizeDateValue(value: string, mode: EntryDateFieldMode): string {
  if (!value) {
    return "";
  }

  return mode === "month" ? `${value}-01` : value;
}

function toDate(value: string, mode: EntryDateFieldMode): Date | null {
  const normalizedValue = normalizeDateValue(value, mode);

  if (!normalizedValue) {
    return null;
  }

  return new Date(normalizedValue);
}

function toModeValue(value: string, mode: EntryDateFieldMode): string {
  if (!value) {
    return "";
  }

  return mode === "month"
    ? value.slice(0, 7)
    : normalizeDateValue(value, "date");
}

function getAlignedEndDate(
  beginDate: string,
  beginDateMode: EntryDateFieldMode,
  endDate: string,
  endDateMode: EntryDateFieldMode,
): string {
  const normalizedBeginDate = normalizeDateValue(beginDate, beginDateMode);
  const normalizedEndDate = normalizeDateValue(endDate, endDateMode);

  if (!normalizedBeginDate) {
    return endDate;
  }

  if (!normalizedEndDate || normalizedBeginDate > normalizedEndDate) {
    return toModeValue(normalizedBeginDate, endDateMode);
  }

  return endDate;
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
    : beginDate;

  return {
    type,
    accountName: props.initialData?.accountName || "",
    description: props.initialData?.description || "",
    amountInput: props.initialData?.amount
      ? String(props.initialData.amount)
      : "",
    beginDate: formatMonthForInput(beginDate),
    endDate: formatMonthForInput(endDate),
    isRecurring: props.initialData ? !props.initialData.endDate : false,
    beginDateMode: "month",
    endDateMode: "month",
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

      const payload: CreateEntryInput = {
        type: isEdit ? form.model.type : entryType || form.model.type,
        accountName: form.model.accountName,
        description: form.model.description,
        amount: parsedAmount,
        beginDate:
          toDate(form.model.beginDate, form.model.beginDateMode) || new Date(),
        endDate: form.model.isRecurring
          ? null
          : toDate(form.model.endDate, form.model.endDateMode),
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
        endDate: draft.endDate,
        isRecurring: draft.isRecurring,
        beginDateMode: draft.beginDateMode,
        endDateMode: draft.endDateMode,
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
      endDate: model.endDate,
      isRecurring: model.isRecurring,
      beginDateMode: model.beginDateMode,
      endDateMode: model.endDateMode,
    });
  }, [
    model.accountName,
    model.amountInput,
    model.beginDate,
    model.beginDateMode,
    model.description,
    model.endDate,
    model.endDateMode,
    model.isRecurring,
    isCreateFlow,
    isDraftReady,
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
    const nextEndDate = model.isRecurring
      ? model.endDate
      : getAlignedEndDate(
          value,
          model.beginDateMode,
          model.endDate,
          model.endDateMode,
        );

    updateFields({
      beginDate: value,
      endDate: nextEndDate,
    });
  };

  const handleEndDateChange = (value: string): void => {
    updateFields({
      endDate: value,
    });
  };

  const handleRecurringChange = (checked: boolean): void => {
    updateFields({
      isRecurring: checked,
      endDate: checked
        ? model.endDate
        : getAlignedEndDate(
            model.beginDate,
            model.beginDateMode,
            model.endDate,
            model.endDateMode,
          ),
    });
  };

  const handleBeginDateModeChange = (): void => {
    const nextBeginDate = normalizeDateValue(
      model.beginDate,
      model.beginDateMode,
    );
    const nextEndDate = model.isRecurring
      ? model.endDate
      : getAlignedEndDate(
          nextBeginDate,
          "date",
          model.endDate,
          model.endDateMode,
        );

    updateFields({
      beginDateMode: "date",
      beginDate: nextBeginDate,
      endDate: nextEndDate,
    });
  };

  const handleEndDateModeChange = (): void => {
    updateFields({
      endDateMode: "date",
      endDate: normalizeDateValue(model.endDate, model.endDateMode),
    });
  };

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

        <EntryDateField
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
          required
        />

        <Checkbox
          checked={model.isRecurring}
          onChange={handleRecurringChange}
          label={i18n.t("entry_form.recurring")}
        />

        {!model.isRecurring && (
          <EntryDateField
            label={i18n.t(
              model.endDateMode === "month"
                ? "entry_form.end_date_month"
                : "entry_form.end_date",
            )}
            mode={model.endDateMode}
            value={fields.endDate.value || ""}
            onChange={handleEndDateChange}
            onEnableFullDate={handleEndDateModeChange}
            editLabel={String(i18n.t("entry_form.edit_full_end_date"))}
          />
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
