"use client";

import React, { useState, useEffect } from "react";
import { Stack, Text } from "@/elements";
import { Button, Input, Select, Checkbox, Autocomplete } from "@/components";
import { i18n } from "@/model/i18n";
import {
  createMultipleEntries,
  CreateEntryInput,
  getAccounts,
} from "@/actions/entries";
import "./bulk_entry_form.scss";

interface BulkEntryItem {
  id: string;
  type: "income" | "expense";
  description: string;
  amount: number;
}

export interface BulkEntryFormProps {
  onSuccess?: () => void;
}

export function BulkEntryForm({
  onSuccess,
}: BulkEntryFormProps): React.ReactElement {
  const [accountName, setAccountName] = useState("");
  const [beginDate, setBeginDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [isRecurring, setIsRecurring] = useState(false);
  const [entries, setEntries] = useState<BulkEntryItem[]>([
    { id: "1", type: "expense", description: "", amount: 0 },
  ]);
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<string[]>([]);

  useEffect(() => {
    async function fetchAccounts() {
      const accountsData = await getAccounts();
      setAccounts(accountsData.map((account) => account.name));
    }
    void fetchAccounts();
  }, []);

  const addEntry = () => {
    const newId = (
      Math.max(...entries.map((e) => parseInt(e.id))) + 1
    ).toString();
    setEntries([
      ...entries,
      { id: newId, type: "expense", description: "", amount: 0 },
    ]);
  };

  const removeEntry = (id: string) => {
    if (entries.length > 1) {
      setEntries(entries.filter((e) => e.id !== id));
    }
  };

  const updateEntry = <Key extends keyof BulkEntryItem>(
    id: string,
    field: Key,
    value: BulkEntryItem[Key],
  ) => {
    setEntries(
      entries.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const inputs: CreateEntryInput[] = entries.map((entry) => ({
        type: entry.type,
        accountName,
        description: entry.description,
        amount: entry.amount,
        beginDate,
        endDate: isRecurring ? null : endDate,
      }));

      const result = await createMultipleEntries(inputs);

      if (result.success) {
        // Reset form
        setAccountName("");
        setBeginDate(new Date());
        setEndDate(new Date());
        setIsRecurring(false);
        setEntries([{ id: "1", type: "expense", description: "", amount: 0 }]);

        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error("Error submitting bulk entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  return (
    <form onSubmit={handleSubmit} className="bulk-entry-form">
      <Stack gap={24}>
        <Text size="h4" weight="semibold">
          {i18n.t("bulk_entry_form.title")}
        </Text>

        <div className="bulk-entry-form__shared">
          <Stack gap={16}>
            <Autocomplete
              label={i18n.t("bulk_entry_form.shared_account")}
              value={accountName}
              onChange={setAccountName}
              options={accounts}
              placeholder={
                i18n.t("bulk_entry_form.shared_account_placeholder") as string
              }
              required
            />

            <Input
              label={i18n.t("bulk_entry_form.shared_begin_date")}
              type="date"
              value={formatDateForInput(beginDate)}
              onChange={(value) => setBeginDate(new Date(value))}
              required
            />

            <Checkbox
              checked={isRecurring}
              onChange={setIsRecurring}
              label={i18n.t("bulk_entry_form.recurring")}
            />

            {!isRecurring && (
              <Input
                label={i18n.t("bulk_entry_form.shared_end_date")}
                type="date"
                value={formatDateForInput(endDate)}
                onChange={(value) => setEndDate(new Date(value))}
              />
            )}
          </Stack>
        </div>

        <div className="bulk-entry-form__entries">
          <Text size="sm" weight="semibold" color="secondary">
            {i18n.t("bulk_entry_form.entries")}
          </Text>
          <Stack gap={12}>
            {entries.map((entry) => (
              <div key={entry.id} className="bulk-entry-form__entry">
                <div className="bulk-entry-form__entry-fields">
                  <Select
                    value={entry.type}
                    onChange={(value) =>
                      updateEntry(
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
                      updateEntry(entry.id, "description", value)
                    }
                    placeholder={
                      i18n.t(
                        "bulk_entry_form.description_placeholder",
                      ) as string
                    }
                    required
                  />

                  <Input
                    type="number"
                    value={entry.amount}
                    onChange={(value) =>
                      updateEntry(entry.id, "amount", parseFloat(value) || 0)
                    }
                    step="0.01"
                    placeholder={
                      i18n.t("bulk_entry_form.amount_placeholder") as string
                    }
                    required
                  />

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
                </div>
              </div>
            ))}
          </Stack>

          <Button type="button" variant="secondary" onClick={addEntry}>
            {i18n.t("bulk_entry_form.add_another_entry")}
          </Button>
        </div>

        <Button type="submit" disabled={loading} fullWidth>
          {loading
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
