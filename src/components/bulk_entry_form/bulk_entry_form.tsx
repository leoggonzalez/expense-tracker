"use client";

import React, { useRef } from "react";
import { useForm } from "react-use-form-library";

import { Stack, Text } from "@/elements";
import { AccountField, Button, Checkbox, Input, Select } from "@/components";
import { createMultipleEntries, CreateEntryInput } from "@/actions/entries";
import { useToast } from "@/components/toast_provider/toast_provider";
import { parseAmountInput, sanitizeAmountInput } from "@/lib/amount";
import { i18n } from "@/model/i18n";
import "./bulk_entry_form.scss";

interface BulkEntryItem {
  id: string;
  type: "income" | "expense";
  description: string;
  amount: string;
}

type BulkEntryFormModel = {
  accountName: string;
  beginDate: string;
  endDate: string;
  isRecurring: boolean;
  entries: BulkEntryItem[];
};

export interface BulkEntryFormProps {
  accounts?: string[];
  onSuccess?: () => void;
}

function formatDateForInput(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getInitialModel(): BulkEntryFormModel {
  const today = formatDateForInput(new Date());

  return {
    accountName: "",
    beginDate: today,
    endDate: today,
    isRecurring: false,
    entries: [{ id: "1", type: "expense", description: "", amount: "" }],
  };
}

export function BulkEntryForm({
  accounts: initialAccounts = [],
  onSuccess,
}: BulkEntryFormProps): React.ReactElement {
  const { showError, showSuccess } = useToast();
  const initialModelRef = useRef<BulkEntryFormModel>(getInitialModel());
  const form = useForm<BulkEntryFormModel>({
    model: initialModelRef.current,
    handleSubmit: async () => {
      const inputs: CreateEntryInput[] = model.entries.map((entry) => ({
        type: entry.type,
        accountName: model.accountName,
        description: entry.description,
        amount: parseAmountInput(entry.amount) || 0,
        beginDate: new Date(model.beginDate),
        endDate: model.isRecurring ? null : new Date(model.endDate),
      }));

      const result = await createMultipleEntries(inputs);

      if (!result.success) {
        showError(i18n.t("toast.entries_create_failed"), {
          iconName: "entries",
        });
        return;
      }

      showSuccess(i18n.t("toast.entries_created"), {
        iconName: "entries",
      });
      reset();

      if (onSuccess) {
        onSuccess();
      }
    },
    onSubmitError: (error) => {
      console.error("Error submitting bulk entries:", error);
      showError(i18n.t("toast.entries_create_failed"), {
        iconName: "entries",
      });
    },
  });
  const { fields, model, onSubmit, reset, submissionStatus, updateFields } =
    form;

  const updateEntryField = <Key extends keyof BulkEntryItem>(
    id: string,
    field: Key,
    value: BulkEntryItem[Key],
  ): void => {
    updateFields({
      entries: model.entries.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry,
      ),
    });
  };

  const addEntry = (): void => {
    const nextId = String(
      Math.max(0, ...model.entries.map((entry) => Number(entry.id))) + 1,
    );

    updateFields({
      entries: [
        ...model.entries,
        { id: nextId, type: "expense", description: "", amount: "" },
      ],
    });
  };

  const removeEntry = (id: string): void => {
    if (model.entries.length === 1) {
      return;
    }

    updateFields({
      entries: model.entries.filter((entry) => entry.id !== id),
    });
  };

  const handleBeginDateChange = (value: string): void => {
    updateFields({
      beginDate: value,
      endDate:
        model.isRecurring || !model.endDate || value <= model.endDate
          ? model.endDate
          : value,
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
      endDate:
        checked || model.endDate || model.beginDate <= model.endDate
          ? model.endDate
          : model.beginDate,
    });
  };

  const isSubmitting = submissionStatus === "submitting";

  return (
    <form onSubmit={onSubmit} className="bulk-entry-form">
      <Stack gap={24}>
        <Text size="h4" weight="semibold">
          {i18n.t("bulk_entry_form.title")}
        </Text>

        <div className="bulk-entry-form__shared">
          <Stack gap={16}>
            <AccountField
              label={i18n.t("bulk_entry_form.shared_account")}
              value={fields.accountName.value || ""}
              onChange={(value) => fields.accountName.onChange(value)}
              accounts={initialAccounts}
              placeholder={
                i18n.t("bulk_entry_form.shared_account_placeholder") as string
              }
              required
            />

            <Input
              label={i18n.t("bulk_entry_form.shared_begin_date")}
              type="date"
              value={fields.beginDate.value || ""}
              onChange={handleBeginDateChange}
              required
            />

            <Checkbox
              checked={model.isRecurring}
              onChange={handleRecurringChange}
              label={i18n.t("bulk_entry_form.recurring")}
            />

            {!model.isRecurring && (
              <Input
                label={i18n.t("bulk_entry_form.shared_end_date")}
                type="date"
                value={fields.endDate.value || ""}
                onChange={handleEndDateChange}
              />
            )}
          </Stack>
        </div>

        <div className="bulk-entry-form__entries">
          <Text size="sm" weight="semibold" color="secondary">
            {i18n.t("bulk_entry_form.entries")}
          </Text>
          <Stack gap={12}>
            {model.entries.map((entry) => (
              <div key={entry.id} className="bulk-entry-form__entry">
                <div className="bulk-entry-form__entry-fields">
                  <Select
                    value={entry.type}
                    onChange={(value) =>
                      updateEntryField(
                        entry.id,
                        "type",
                        value as BulkEntryItem["type"],
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
                  />

                  <Input
                    value={entry.description}
                    onChange={(value) =>
                      updateEntryField(entry.id, "description", value)
                    }
                    placeholder={
                      i18n.t(
                        "bulk_entry_form.description_placeholder",
                      ) as string
                    }
                    required
                  />

                  <Input
                    type="text"
                    inputMode="decimal"
                    value={entry.amount}
                    onChange={(value) =>
                      updateEntryField(
                        entry.id,
                        "amount",
                        sanitizeAmountInput(value),
                      )
                    }
                    placeholder={
                      i18n.t("bulk_entry_form.amount_placeholder") as string
                    }
                    required
                  />

                  {model.entries.length > 1 && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => removeEntry(entry.id)}
                    >
                      {i18n.t("bulk_entry_form.remove")}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </Stack>

          <Button type="button" variant="secondary" onClick={addEntry}>
            {i18n.t("bulk_entry_form.add_another_entry")}
          </Button>
        </div>

        <Button type="submit" disabled={isSubmitting} fullWidth>
          {isSubmitting
            ? i18n.t("bulk_entry_form.add_entries_loading")
            : i18n.t(
                model.entries.length === 1
                  ? "bulk_entry_form.add_entries_one"
                  : "bulk_entry_form.add_entries_other",
                { count: model.entries.length },
              )}
        </Button>
      </Stack>
    </form>
  );
}
