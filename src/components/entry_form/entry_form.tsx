"use client";

import React, { useState, useEffect } from "react";
import { Stack } from "@/elements";
import { AccountField, Button, Input, Select, Checkbox } from "@/components";
import { i18n } from "@/model/i18n";
import { useToast } from "@/components/toast_provider/toast_provider";
import {
  clearNewEntryDraft,
  loadNewEntryDraft,
  saveNewEntryDraft,
  setNewEntryFlowActive,
} from "@/lib/new_entry_draft";
import {
  createEntry,
  CreateEntryInput,
  getAccounts,
  updateEntry,
} from "@/actions/entries";
import { parseAmountInput, sanitizeAmountInput } from "@/lib/amount";
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
  entryType?: "income" | "expense";
  hideTypeField?: boolean;
}

export function EntryForm({
  onSuccess,
  initialData,
  isEdit = false,
  entryType,
  hideTypeField = false,
}: EntryFormProps): React.ReactElement {
  const { showError, showSuccess } = useToast();
  const isCreateFlow = !isEdit && Boolean(entryType);
  const [formData, setFormData] = useState<Partial<CreateEntryInput>>({
    type: entryType || (initialData?.type as "income" | "expense") || "expense",
    accountName: initialData?.accountName || "",
    description: initialData?.description || "",
    amount: initialData?.amount ?? 0,
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
  const [amountInput, setAmountInput] = useState(
    initialData?.amount ? String(initialData.amount) : "",
  );

  useEffect(() => {
    if (!isCreateFlow || initialData) {
      return;
    }

    setNewEntryFlowActive(true);

    const draft = loadNewEntryDraft();

    if (!draft) {
      return;
    }

    setFormData((currentFormData) => ({
      ...currentFormData,
      accountName: draft.accountName,
      description: draft.description,
      beginDate: draft.beginDate ? new Date(draft.beginDate) : new Date(),
      endDate: draft.endDate ? new Date(draft.endDate) : null,
    }));
    setAmountInput(draft.amountInput);
    setIsRecurring(draft.isRecurring);
  }, [initialData, isCreateFlow]);

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

  useEffect(() => {
    if (!entryType) {
      return;
    }

    setFormData((currentFormData) => ({ ...currentFormData, type: entryType }));
  }, [entryType]);

  useEffect(() => {
    if (!isCreateFlow) {
      return;
    }

    saveNewEntryDraft({
      accountName: formData.accountName || "",
      description: formData.description || "",
      amountInput,
      beginDate: formatDateForInput(formData.beginDate),
      endDate: formatDateForInput(formData.endDate),
      isRecurring,
    });
  }, [
    amountInput,
    formData.accountName,
    formData.beginDate,
    formData.description,
    formData.endDate,
    isCreateFlow,
    isRecurring,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const parsedAmount = parseAmountInput(amountInput);

      if (parsedAmount === null) {
        showError(i18n.t("toast.entry_create_failed") as string);
        setLoading(false);
        return;
      }

      const payload = {
        ...formData,
        type: (entryType || formData.type) as "income" | "expense",
        amount: parsedAmount,
      } as CreateEntryInput;

      const result =
        isEdit && initialData?.id
          ? await updateEntry(initialData.id, payload)
          : await createEntry(payload);

      if (result.success) {
        if (!isEdit) {
          clearNewEntryDraft();
          showSuccess(i18n.t("toast.entry_created") as string);
        }
        if (!isEdit) {
          setFormData({
            type: entryType || "expense",
            accountName: "",
            description: "",
            amount: 0,
            beginDate: new Date(),
            endDate: new Date(),
          });
          setAmountInput("");
          setIsRecurring(false);
        }

        if (onSuccess) {
          onSuccess();
        }
      } else {
        if (!isEdit) {
          showError(i18n.t("toast.entry_create_failed") as string);
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      if (!isEdit) {
        showError(i18n.t("toast.entry_create_failed") as string);
      }
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
        {!hideTypeField && (
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
        )}
        <AccountField
          label={i18n.t("entry_form.account")}
          value={formData.accountName || ""}
          onChange={(value) => setFormData({ ...formData, accountName: value })}
          accounts={accounts}
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
          type="text"
          inputMode="decimal"
          value={amountInput}
          onChange={(value) => setAmountInput(sanitizeAmountInput(value))}
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
