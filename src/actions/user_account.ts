"use server";

import { prisma } from "@/lib/prisma";
import { requireCurrentUserAccount } from "@/lib/session";

type UpdateUserAccountProfileResult = {
  success: boolean;
  error?: string;
};

export async function updateCurrentUserAccountProfile(input: {
  name: string;
}): Promise<UpdateUserAccountProfileResult> {
  const currentUserAccount = await requireCurrentUserAccount();
  const name = input.name.trim();

  try {
    await prisma.userAccount.update({
      where: {
        id: currentUserAccount.id,
      },
      data: {
        name: name || null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to update current user account profile:", error);
    return { success: false, error: "settings_page.update_failed" };
  }
}
