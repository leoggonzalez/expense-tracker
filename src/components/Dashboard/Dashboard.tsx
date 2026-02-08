'use client';

import './Dashboard.scss';

import { Box, Stack, Text } from '@/elements';
import { Entry, EntryCollection, IEntry } from '@/model';

import React from 'react';
import { startOfMonth } from 'date-fns';

export interface DashboardProps {
  entries: Array<{
    id: string;
    type: string;
    group: string;
    description: string;
    amount: number;
    beginDate: string;
    endDate: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
}

export const Dashboard: React.FC<DashboardProps> = ({ entries: plainEntries }) => {
  // Convert plain objects to Entry instances
  const entries = plainEntries.map((entry) => Entry.fromJSON({
    ...entry,
    beginDate: new Date(entry.beginDate),
    endDate: entry.endDate ? new Date(entry.endDate) : null,
    createdAt: new Date(entry.createdAt),
    updatedAt: new Date(entry.updatedAt),
  }));

  const collection = new EntryCollection(entries);
  const currentMonth = startOfMonth(new Date());

  const income = collection.getTotalForMonth(currentMonth, 'income');
  const expense = collection.getTotalForMonth(currentMonth, 'expense');
  const net = income + expense; // expense is negative

  const formatCurrency = (amount: number): string => {
    const absAmount = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';
    return `${sign}${absAmount.toFixed(2)} €`;
  };

  return (
    <div className="dashboard">
      <Stack gap={24}>
        <Text size="h2" as="h2" weight="bold">
          Current Month Overview
        </Text>

        <div className="dashboard__cards">
          <div className="dashboard__card dashboard__card--income">
            <Text size="sm" color="secondary" weight="medium">
              Income
            </Text>
            <Text size="2xl" weight="bold" color="success">
              {formatCurrency(income)}
            </Text>
          </div>

          <div className="dashboard__card dashboard__card--expense">
            <Text size="sm" color="secondary" weight="medium">
              Expenses
            </Text>
            <Text size="2xl" weight="bold" color="danger">
              {formatCurrency(expense)}
            </Text>
          </div>

          <div className="dashboard__card dashboard__card--net">
            <Text size="sm" color="secondary" weight="medium">
              Net
            </Text>
            <Text
              size="2xl"
              weight="bold"
              color={net >= 0 ? 'success' : 'danger'}
            >
              {formatCurrency(net)}
            </Text>
          </div>
        </div>

        <div className="dashboard__summary">
          <Text size="h4" as="h3" weight="semibold">
            Active Entries
          </Text>
          <Text size="lg" color="secondary">
            {collection.getActiveInMonth(currentMonth).length} entries active this month
          </Text>
        </div>
      </Stack>
    </div>
  );
};
