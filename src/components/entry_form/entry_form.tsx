"use client";

import React, { useState, useEffect } from "react";
import { Stack } from "@/elements";
import { Button, Input, Select, Checkbox, Autocomplete } from "@/components";
import { createEntry, CreateEntryInput, getGroups } from "@/actions/entries";
import "./entry_form.scss";

export interface EntryFormProps {
  onSuccess?: () => void;
  initialData?: {
    id: string;
    type: string;
    groupName: string;
    description: string;
    amount: number;
    beginDate: string;
    endDate: string | null;
  };
  isEdit?: boolean;
}

export const EntryForm: React.FC<EntryFormProps> = ({
  onSuccess,
  initialData,
  isEdit = false,
}) => {
  const today = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState<Partial<CreateEntryInput>>({
    type: (initialData?.type as "income" | "expense") || "expense",
    groupName: initialData?.groupName || "",
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
  const [groups, setGroups] = useState<string[]>([]);

  useEffect(() => {
    async function fetchGroups() {
      const groupsData = await getGroups();
      setGroups(groupsData.map((g) => g.name));
    }
    fetchGroups();
  }, []);

  useEffect(() => {
    if (isRecurring) {
      setFormData({ ...formData, endDate: null });
    } else if (!formData.endDate) {
      setFormData({ ...formData, endDate: new Date() });
    }
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
          groupName: "",
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
          label="Type"
          value={formData.type || ""}
          onChange={(value) =>
            setFormData({ ...formData, type: value as "income" | "expense" })
          }
          options={[
            { value: "income", label: "Income" },
            { value: "expense", label: "Expense" },
          ]}
          required
        />

        <Autocomplete
          label="Group"
          value={formData.groupName || ""}
          onChange={(value) => setFormData({ ...formData, groupName: value })}
          options={groups}
          placeholder="e.g., income, Various, Investment"
          required
        />

        <Input
          label="Description"
          value={formData.description || ""}
          onChange={(value) => setFormData({ ...formData, description: value })}
          placeholder="e.g., Salary, Rent"
          required
        />

        <Input
          label="Amount"
          type="number"
          value={formData.amount || 0}
          onChange={(value) =>
            setFormData({ ...formData, amount: parseFloat(value) || 0 })
          }
          step="0.01"
          placeholder="0.00"
          required
        />

        <Input
          label="Begin Date"
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
          label="Recurring"
        />

        {!isRecurring && (
          <Input
            label="End Date"
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
              ? "Updating..."
              : "Adding..."
            : isEdit
              ? "Update Entry"
              : "Add Entry"}
        </Button>
      </Stack>
    </form>
  );
};
