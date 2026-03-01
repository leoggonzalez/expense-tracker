"use server";

import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/session";

type UpdateUserProfileResult = {
  success: boolean;
  error?: string;
};

export async function updateCurrentUserProfile(input: {
  name: string;
}): Promise<UpdateUserProfileResult> {
  const currentUser = await requireCurrentUser();
  const name = input.name.trim();

  try {
    await prisma.user.update({
      where: {
        id: currentUser.id,
      },
      data: {
        name: name || null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to update current user profile:", error);
    return { success: false, error: "settings_page.update_failed" };
  }
}
