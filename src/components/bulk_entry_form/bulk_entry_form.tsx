"use client";

import "./bulk_entry_form.scss";

import {
  SpaceField,
  Button,
  Input,
  MonthSelector,
  Select,
} from "@/components";
import { CreateEntryInput, createMultipleEntries } from "@/actions/entries";
import {
  EntryScheduleMode,
  inferEntryDateMode,
  resolveEndDate,
  toDate,
} from "@/lib/entry_schedule";
import React, { useMemo, useRef, useState } from "react";
import { Stack, Text } from "@/elements";
import { parseAmountInput, sanitizeAmountInput } from "@/lib/amount";

import { format } from "date-fns";
import { i18n } from "@/model/i18n";
import { useToast } from "@/components/toast_provider/toast_provider";

interface BulkEntryItem {
  id: string;
  type: "income" | "expense";
  description: string;
  amount: string;
}

export interface BulkEntryFormProps {
  spaces?: string[];
  onSuccess?: () => void;
}

type SharedScheduleState = {
  spaceName: string;
  beginDate: string;
  scheduleMode: EntryScheduleMode;
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

function getInitialEntries(): BulkEntryItem[] {
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

export function BulkEntryForm({
  spaces: initialSpaces = [],
  onSuccess,
}: BulkEntryFormProps): React.ReactElement {
  const { showError, showSuccess } = useToast();
  const [shared, setShared] = useState<SharedScheduleState>(
    getInitialSharedState(),
  );
  const [entries, setEntries] = useState<BulkEntryItem[]>(getInitialEntries());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nextIdRef = useRef(2);

  const beginDateMode = inferEntryDateMode(shared.beginDate);
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

  const updateEntryField = <Key extends keyof BulkEntryItem>(
    id: string,
    field: Key,
    value: BulkEntryItem[Key],
  ): void => {
    setEntries((currentEntries) =>
      currentEntries.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry,
      ),
    );
  };

  const addEntry = (): void => {
    const nextId = String(nextIdRef.current);
    nextIdRef.current += 1;

    setEntries((currentEntries) => [
      ...currentEntries,
      { id: nextId, type: "expense", description: "", amount: "" },
    ]);
  };

  const removeEntry = (id: string): void => {
    setEntries((currentEntries) => {
      if (currentEntries.length <= 1) {
        return currentEntries;
      }

      return currentEntries.filter((entry) => entry.id !== id);
    });
  };

  const resetForm = (): void => {
    setShared(getInitialSharedState());
    setEntries(getInitialEntries());
    nextIdRef.current = 2;
  };

  const onSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();

    const parsedBeginDate = toDate(shared.beginDate, beginDateMode);
    const installments = parseInstallments(shared.installments);

    if (!shared.spaceName || !parsedBeginDate) {
      showError(i18n.t("toast.entries_create_failed"), {
        iconName: "entries",
      });
      return;
    }

    if (shared.scheduleMode === "installments" && !installments) {
      showError(i18n.t("entry_form.invalid_installments"), {
        iconName: "entries",
      });
      return;
    }

    const payloadEndDate = resolveEndDate({
      scheduleMode: shared.scheduleMode,
      beginDate: parsedBeginDate,
      installments: installments || 1,
    });

    const inputs: CreateEntryInput[] = [];

    for (const entry of entries) {
      const parsedAmount = parseAmountInput(entry.amount);

      if (!entry.description || parsedAmount === null) {
        showError(i18n.t("toast.entries_create_failed"), {
          iconName: "entries",
        });
        return;
      }

      inputs.push({
        type: entry.type,
        spaceName: shared.spaceName,
        description: entry.description,
        amount: parsedAmount,
        beginDate: parsedBeginDate,
        endDate: payloadEndDate,
      });
    }

    setIsSubmitting(true);
    const result = await createMultipleEntries(inputs);
    setIsSubmitting(false);

    if (!result.success) {
      showError(i18n.t("toast.entries_create_failed"), {
        iconName: "entries",
      });
      return;
    }

    showSuccess(i18n.t("toast.entries_created"), {
      iconName: "entries",
    });
    resetForm();

    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <form onSubmit={onSubmit} className="bulk-entry-form">
      <Stack gap={24}>
        <Text size="h4" weight="semibold">
          {i18n.t("bulk_entry_form.title")}
        </Text>

        <Stack gap={16}>
          <SpaceField
            label={i18n.t("bulk_entry_form.shared_space")}
            value={shared.spaceName}
            onChange={(value) =>
              setShared((current) => ({ ...current, spaceName: value }))
            }
            spaces={initialSpaces}
            placeholder={
              i18n.t("bulk_entry_form.shared_space_placeholder") as string
            }
            required
          />

          <Stack gap={4}>
            <Text size="sm" weight="medium" color="secondary">
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
                <label
                  key={option.value}
                  className="bulk-entry-form__schedule-option"
                >
                  <input
                    type="radio"
                    name="bulk-entry-schedule"
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
                ? "entry_form.begin_date_month"
                : "entry_form.begin_date",
            )}
            value={shared.beginDate}
            onChange={(value) =>
              setShared((current) => ({ ...current, beginDate: value }))
            }
            editLabel={String(i18n.t("entry_form.edit_full_begin_date"))}
            closeLabel={String(i18n.t("entry_form.use_month_year_begin_date"))}
            monthLabel={i18n.t("entry_form.month")}
            yearLabel={i18n.t("entry_form.year")}
            required
          />

          {shared.scheduleMode === "installments" && (
            <Stack gap={8}>
              <Input
                label={i18n.t("entry_form.installments")}
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
        </Stack>

        <div className="bulk-entry-form__entries">
          <Text size="sm" weight="semibold" color="secondary">
            {i18n.t("bulk_entry_form.entries")}
          </Text>
          <Stack gap={12}>
            {entries.map((entry) => (
              <Stack
                direction="row"
                wrap
                gap={12}
                align="center"
                justify="space-between"
                key={entry.id}
              >
                <Stack direction="row" wrap gap={12} align="center">
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
                </Stack>

                {entries.length > 1 && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => removeEntry(entry.id)}
                  >
                    {i18n.t("bulk_entry_form.remove")}
                  </Button>
                )}
              </Stack>
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
                entries.length === 1
                  ? "bulk_entry_form.add_entries_one"
                  : "bulk_entry_form.add_entries_other",
                { count: entries.length },
              )}
        </Button>
      </Stack>
    </form>
  );
}
