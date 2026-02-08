'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export interface CreateEntryInput {
  type: 'income' | 'expense';
  group: string;
  description: string;
  amount: number;
  beginDate: Date;
  endDate?: Date | null;
}

export async function createEntry(input: CreateEntryInput) {
  try {
    const entry = await prisma.entry.create({
      data: {
        type: input.type,
        group: input.group,
        description: input.description,
        amount: input.amount,
        beginDate: input.beginDate,
        endDate: input.endDate || null,
      },
    });

    revalidatePath('/');
    revalidatePath('/projection');
    revalidatePath('/entries');
    
    return { success: true, entry };
  } catch (error) {
    console.error('Error creating entry:', error);
    return { success: false, error: 'Failed to create entry' };
  }
}

export async function getEntries() {
  try {
    const entries = await prisma.entry.findMany({
      orderBy: [
        { group: 'asc' },
        { beginDate: 'asc' },
      ],
    });

    return entries;
  } catch (error) {
    console.error('Error fetching entries:', error);
    return [];
  }
}

export async function getEntryById(id: string) {
  try {
    const entry = await prisma.entry.findUnique({
      where: { id },
    });

    return entry;
  } catch (error) {
    console.error('Error fetching entry:', error);
    return null;
  }
}

export async function updateEntry(id: string, input: Partial<CreateEntryInput>) {
  try {
    const entry = await prisma.entry.update({
      where: { id },
      data: {
        ...(input.type && { type: input.type }),
        ...(input.group && { group: input.group }),
        ...(input.description && { description: input.description }),
        ...(input.amount !== undefined && { amount: input.amount }),
        ...(input.beginDate && { beginDate: input.beginDate }),
        ...(input.endDate !== undefined && { endDate: input.endDate }),
      },
    });

    revalidatePath('/');
    revalidatePath('/projection');
    revalidatePath('/entries');
    
    return { success: true, entry };
  } catch (error) {
    console.error('Error updating entry:', error);
    return { success: false, error: 'Failed to update entry' };
  }
}

export async function deleteEntry(id: string) {
  try {
    await prisma.entry.delete({
      where: { id },
    });

    revalidatePath('/');
    revalidatePath('/projection');
    revalidatePath('/entries');
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting entry:', error);
    return { success: false, error: 'Failed to delete entry' };
  }
}
