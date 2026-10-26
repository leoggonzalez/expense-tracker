"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUserAccount } from "@/lib/session";
import { Transaction } from "@/lib/transaction";
import { revalidateTransactionMutationPages } from "@/lib/app_revalidation";
import type {
  MassTransactionUpdate,
  MassEditTransaction,
} from "@/lib/mass_transaction_edit";

export async function getMassEditTransactions(
  ids: string[],
): Promise<MassEditTransaction[] | null> {
  const user = await requireCurrentUserAccount();
  try {
    return await Transaction.listForMassEdit(user.id, ids);
  } catch {
    return null;
  }
}

export async function updateMassTransactions(
  input: MassTransactionUpdate,
): Promise<{ success: boolean; error?: string }> {
  const user = await requireCurrentUserAccount();
  try {
    const spaceIds = await Transaction.massUpdateForUser(user.id, input);
    revalidateTransactionMutationPages();
    revalidatePath("/spaces");
    for (const spaceId of spaceIds) revalidatePath(`/spaces/${spaceId}`);
    for (const transaction of input.transactions)
      revalidatePath(`/transactions/${transaction.id}`);
    return { success: true };
  } catch (error) {
    const key =
      error instanceof Error && error.message.startsWith("mass_edit.")
        ? error.message
        : "mass_edit.failed";
    return { success: false, error: key };
  }
}
