'use client';

import React, { useState, useEffect } from 'react';
import { Stack, Text } from '@/elements';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';
import { Select } from '../Select/Select';
import { Checkbox } from '../Checkbox/Checkbox';
import { Autocomplete } from '../Autocomplete/Autocomplete';
import { createMultipleEntries, CreateEntryInput, getGroups } from '@/actions/entries';
import './BulkEntryForm.scss';

interface BulkEntryItem {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
}

export interface BulkEntryFormProps {
  onSuccess?: () => void;
}

export const BulkEntryForm: React.FC<BulkEntryFormProps> = ({ onSuccess }) => {
  const [groupName, setGroupName] = useState('');
  const [beginDate, setBeginDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [isRecurring, setIsRecurring] = useState(false);
  const [entries, setEntries] = useState<BulkEntryItem[]>([
    { id: '1', type: 'expense', description: '', amount: 0 },
  ]);
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<string[]>([]);

  useEffect(() => {
    async function fetchGroups() {
      const groupsData = await getGroups();
      setGroups(groupsData.map(g => g.name));
    }
    fetchGroups();
  }, []);

  const addEntry = () => {
    const newId = (Math.max(...entries.map(e => parseInt(e.id))) + 1).toString();
    setEntries([...entries, { id: newId, type: 'expense', description: '', amount: 0 }]);
  };

  const removeEntry = (id: string) => {
    if (entries.length > 1) {
      setEntries(entries.filter(e => e.id !== id));
    }
  };

  const updateEntry = (id: string, field: keyof BulkEntryItem, value: any) => {
    setEntries(entries.map(e => (e.id === id ? { ...e, [field]: value } : e)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const inputs: CreateEntryInput[] = entries.map(entry => ({
        type: entry.type,
        groupName,
        description: entry.description,
        amount: entry.amount,
        beginDate,
        endDate: isRecurring ? null : endDate,
      }));

      const result = await createMultipleEntries(inputs);
      
      if (result.success) {
        // Reset form
        setGroupName('');
        setBeginDate(new Date());
        setEndDate(new Date());
        setIsRecurring(false);
        setEntries([{ id: '1', type: 'expense', description: '', amount: 0 }]);
        
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Error submitting bulk entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  return (
    <form onSubmit={handleSubmit} className="bulk-entry-form">
      <Stack gap={24}>
        <Text size="h4" weight="semibold">
          Add Multiple Entries
        </Text>

        <div className="bulk-entry-form__shared">
          <Stack gap={16}>
            <Autocomplete
              label="Group (shared for all entries)"
              value={groupName}
              onChange={setGroupName}
              options={groups}
              placeholder="e.g., Various, Investment"
              required
            />

            <Input
              label="Begin Date (shared)"
              type="date"
              value={formatDateForInput(beginDate)}
              onChange={(value) => setBeginDate(new Date(value))}
              required
            />

            <Checkbox
              checked={isRecurring}
              onChange={setIsRecurring}
              label="Recurring"
            />

            {!isRecurring && (
              <Input
                label="End Date (shared)"
                type="date"
                value={formatDateForInput(endDate)}
                onChange={(value) => setEndDate(new Date(value))}
              />
            )}
          </Stack>
        </div>

        <div className="bulk-entry-form__entries">
          <Text size="sm" weight="semibold" color="secondary">
            Entries
          </Text>
          <Stack gap={12}>
            {entries.map((entry, index) => (
              <div key={entry.id} className="bulk-entry-form__entry">
                <div className="bulk-entry-form__entry-fields">
                  <Select
                    value={entry.type}
                    onChange={(value) => updateEntry(entry.id, 'type', value)}
                    options={[
                      { value: 'income', label: 'Income' },
                      { value: 'expense', label: 'Expense' },
                    ]}
                  />

                  <Input
                    value={entry.description}
                    onChange={(value) => updateEntry(entry.id, 'description', value)}
                    placeholder="Description"
                    required
                  />

                  <Input
                    type="number"
                    value={entry.amount}
                    onChange={(value) => updateEntry(entry.id, 'amount', parseFloat(value) || 0)}
                    step="0.01"
                    placeholder="Amount"
                    required
                  />

                  {entries.length > 1 && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => removeEntry(entry.id)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </Stack>

          <Button type="button" variant="secondary" onClick={addEntry}>
            + Add Another Entry
          </Button>
        </div>

        <Button type="submit" disabled={loading} fullWidth>
          {loading ? 'Adding Entries...' : `Add ${entries.length} ${entries.length === 1 ? 'Entry' : 'Entries'}`}
        </Button>
      </Stack>
    </form>
  );
};
