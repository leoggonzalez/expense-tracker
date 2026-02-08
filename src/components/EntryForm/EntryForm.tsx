'use client';

import React, { useState } from 'react';
import { Stack } from '@/elements';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';
import { Select } from '../Select/Select';
import { createEntry, CreateEntryInput } from '@/actions/entries';
import './EntryForm.scss';

export interface EntryFormProps {
  onSuccess?: () => void;
}

export const EntryForm: React.FC<EntryFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState<Partial<CreateEntryInput>>({
    type: 'expense',
    group: '',
    description: '',
    amount: 0,
    beginDate: new Date(),
    endDate: null,
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createEntry(formData as CreateEntryInput);
      
      if (result.success) {
        // Reset form
        setFormData({
          type: 'expense',
          group: '',
          description: '',
          amount: 0,
          beginDate: new Date(),
          endDate: null,
        });
        
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (date: Date | null | undefined): string => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  return (
    <form onSubmit={handleSubmit} className="entry-form">
      <Stack gap={16}>
        <Select
          label="Type"
          value={formData.type || ''}
          onChange={(value) => setFormData({ ...formData, type: value as 'income' | 'expense' })}
          options={[
            { value: 'income', label: 'Income' },
            { value: 'expense', label: 'Expense' },
          ]}
          required
        />

        <Input
          label="Group"
          value={formData.group || ''}
          onChange={(value) => setFormData({ ...formData, group: value })}
          placeholder="e.g., income, Various, Investment"
          required
        />

        <Input
          label="Description"
          value={formData.description || ''}
          onChange={(value) => setFormData({ ...formData, description: value })}
          placeholder="e.g., Salary, Rent"
          required
        />

        <Input
          label="Amount"
          type="number"
          value={formData.amount || 0}
          onChange={(value) => setFormData({ ...formData, amount: parseFloat(value) || 0 })}
          step="0.01"
          placeholder="0.00"
          required
        />

        <Input
          label="Begin Date"
          type="date"
          value={formatDateForInput(formData.beginDate)}
          onChange={(value) => setFormData({ ...formData, beginDate: new Date(value) })}
          required
        />

        <Input
          label="End Date (Optional)"
          type="date"
          value={formatDateForInput(formData.endDate)}
          onChange={(value) => setFormData({ ...formData, endDate: value ? new Date(value) : null })}
        />

        <Button type="submit" disabled={loading} fullWidth>
          {loading ? 'Adding...' : 'Add Entry'}
        </Button>
      </Stack>
    </form>
  );
};
