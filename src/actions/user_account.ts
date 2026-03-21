"use server";

import { requireCurrentUserAccount } from "@/lib/session";
import { UserAccount } from "@/lib/user_account";

type UpdateUserAccountProfileResult = {
  success: boolean;
  error?: string;
};

// Update
export async function updateCurrentUserAccountProfile(input: {
  name: string;
}): Promise<UpdateUserAccountProfileResult> {
  const currentUserAccount = await requireCurrentUserAccount();
  const name = input.name.trim();

  try {
    const userAccount = await UserAccount.findById(currentUserAccount.id);

    if (!userAccount) {
      return { success: false, error: "settings_page.update_failed" };
    }

    await userAccount.updateName(name || null);

    return { success: true };
  } catch (error) {
    console.error("Failed to update current user account profile:", error);
    return { success: false, error: "settings_page.update_failed" };
  }
}
