"use client";

import React, { useState, useEffect } from "react";
import { Stack } from "@/elements";
import { Button, Input, Select, Checkbox, Autocomplete } from "@/components";
import { i18n } from "@/model/i18n";
import { createEntry, CreateEntryInput, getAccounts } from "@/actions/entries";
import "./entry_form.scss";

export interface EntryFormProps {
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
}

export function EntryForm({
  onSuccess,
  initialData,
  isEdit = false,
}: EntryFormProps): React.ReactElement {
  const [formData, setFormData] = useState<Partial<CreateEntryInput>>({
    type: (initialData?.type as "income" | "expense") || "expense",
    accountName: initialData?.accountName || "",
    description: initialData?.description || "",
    amount: initialData?.amount || 0,
    beginDate: initialData?.beginDate
      ? new Date(initialData.beginDate)
      : new Date(),
    endDate: initialData?.endDate ? new Date(initialData.endDate) : new Date(),
  });

  const [isRecurring, setIsRecurring] = useState(
    initialData ? !initialData.endDate : false,
  );
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<string[]>([]);

  useEffect(() => {
    async function fetchAccounts() {
      const accountsData = await getAccounts();
      setAccounts(accountsData.map((account) => account.name));
    }
    void fetchAccounts();
  }, []);

  useEffect(() => {
    if (isRecurring) {
      setFormData((currentFormData) =>
        currentFormData.endDate === null
          ? currentFormData
          : { ...currentFormData, endDate: null },
      );
      return;
    }

    setFormData((currentFormData) =>
      currentFormData.endDate
        ? currentFormData
        : { ...currentFormData, endDate: new Date() },
    );
  }, [isRecurring]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createEntry(formData as CreateEntryInput);

      if (result.success) {
        // Reset form
        setFormData({
          type: "expense",
          accountName: "",
          description: "",
          amount: 0,
          beginDate: new Date(),
          endDate: new Date(),
        });
        setIsRecurring(false);

        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (date: Date | null | undefined): string => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  return (
    <form onSubmit={handleSubmit} className="entry-form">
      <Stack gap={16}>
        <Select
          label={i18n.t("entry_form.type")}
          value={formData.type || ""}
          onChange={(value) =>
            setFormData({ ...formData, type: value as "income" | "expense" })
          }
          options={[
            { value: "income", label: i18n.t("common.income") },
            { value: "expense", label: i18n.t("common.expense") },
          ]}
          required
        />

        <Autocomplete
          label={i18n.t("entry_form.account")}
          value={formData.accountName || ""}
          onChange={(value) => setFormData({ ...formData, accountName: value })}
          options={accounts}
          placeholder={i18n.t("entry_form.account_placeholder") as string}
          required
        />

        <Input
          label={i18n.t("entry_form.description")}
          value={formData.description || ""}
          onChange={(value) => setFormData({ ...formData, description: value })}
          placeholder={i18n.t("entry_form.description_placeholder") as string}
          required
        />

        <Input
          label={i18n.t("entry_form.amount")}
          type="number"
          value={formData.amount || 0}
          onChange={(value) =>
            setFormData({ ...formData, amount: parseFloat(value) || 0 })
          }
          step="0.01"
          placeholder={i18n.t("entry_form.amount_placeholder") as string}
          required
        />

        <Input
          label={i18n.t("entry_form.begin_date")}
          type="date"
          value={formatDateForInput(formData.beginDate)}
          onChange={(value) =>
            setFormData({ ...formData, beginDate: new Date(value) })
          }
          required
        />

        <Checkbox
          checked={isRecurring}
          onChange={setIsRecurring}
          label={i18n.t("entry_form.recurring")}
        />

        {!isRecurring && (
          <Input
            label={i18n.t("entry_form.end_date")}
            type="date"
            value={formatDateForInput(formData.endDate)}
            onChange={(value) =>
              setFormData({ ...formData, endDate: new Date(value) })
            }
          />
        )}

        <Button type="submit" disabled={loading} fullWidth>
          {loading
            ? isEdit
              ? i18n.t("entry_form.updating")
              : i18n.t("entry_form.adding")
            : isEdit
              ? i18n.t("entry_form.update_entry")
              : i18n.t("entry_form.add_entry")}
        </Button>
      </Stack>
    </form>
  );
}
