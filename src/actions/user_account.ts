"use server";

import { requireCurrentUserAccount } from "@/lib/session";
import { UserAccount } from "@/lib/user_account";

type UpdateUserAccountProfileResult = {
  success: boolean;
  error?: string;
};

export type CurrentUserAccountProfilePayload = {
  email: string;
  name: string | null;
};

// Read
export async function getCurrentUserAccountProfilePayloadForUser(
  userAccountId: string,
): Promise<CurrentUserAccountProfilePayload | null> {
  const userAccount = await UserAccount.findById(userAccountId);

  if (!userAccount) {
    return null;
  }

  const userAccountRecord = userAccount.toRecord();

  return {
    email: userAccountRecord.email,
    name: userAccountRecord.name,
  };
}

// Update
export async function updateCurrentUserAccountProfile(input: {
  name: string;
}): Promise<UpdateUserAccountProfileResult> {
  const currentUserAccount = await requireCurrentUserAccount();
  const name = input.name.trim();

  try {
    const userAccount = await UserAccount.findById(currentUserAccount.id);

    if (!userAccount) {
      return { success: false, error: "account.update_failed" };
    }

    await userAccount.updateName(name || null);

    return { success: true };
  } catch (error) {
    console.error("Failed to update current user account profile:", error);
    return { success: false, error: "account.update_failed" };
  }
}
