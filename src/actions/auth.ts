"use server";

import { redirect } from "next/navigation";

import {
  generateLoginCode,
  generateSessionToken,
  hashLoginCode,
  isDevAdminEmail,
  isDevelopmentAuthBypassEnabled,
  isValidDevAdminCode,
  isValidEmail,
  normalizeEmail,
  verifyLoginCode as verifyStoredLoginCode,
} from "@/lib/auth";
import { LoginCode } from "@/lib/login_code";
import { sendLoginCodeEmail } from "@/lib/email";
import { clearCurrentSession, createSession } from "@/lib/session";
import { UserAccount } from "@/lib/user_account";

type AuthResult = {
  success: boolean;
  error?: string;
};

// Create
export async function requestLoginCode(input: {
  email: string;
}): Promise<AuthResult> {
  const email = normalizeEmail(input.email);

  if (!isValidEmail(email)) {
    return { success: false, error: "auth.invalid_email" };
  }

  try {
    if (isDevelopmentAuthBypassEnabled() && isDevAdminEmail(email)) {
      await UserAccount.upsertByEmail(email, { name: "Admin" });
      return { success: true };
    }

    const userAccount = await UserAccount.findByEmail(email);

    if (!userAccount) {
      return { success: false, error: "auth.account_not_found" };
    }

    await LoginCode.consumeActiveCodesForEmail(userAccount.persistedId, email);

    const code = generateLoginCode();
    const loginCode = await new LoginCode({
      userAccountId: userAccount.persistedId,
      email,
      codeHash: hashLoginCode(email, code),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    }).create();

    try {
      await sendLoginCodeEmail({ to: email, code });
    } catch (error) {
      console.error("Failed to send login code email:", error);
      await loginCode.delete();
      return { success: false, error: "auth.email_send_failed" };
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to request login code:", error);
    return { success: false, error: "auth.request_failed" };
  }
}

// Read
export async function verifyLoginCode(input: {
  email: string;
  code: string;
}): Promise<AuthResult> {
  const email = normalizeEmail(input.email);
  const code = input.code.trim();

  if (!isValidEmail(email)) {
    return { success: false, error: "auth.invalid_email" };
  }

  if (!/^\d{6}$/.test(code)) {
    return { success: false, error: "auth.invalid_code" };
  }

  try {
    if (isValidDevAdminCode(email, code)) {
      const adminUser = await UserAccount.upsertByEmail(email, { name: "Admin" });
      await createSession(adminUser.persistedId, generateSessionToken());
      return { success: true };
    }

    const userAccount = await UserAccount.findByEmail(email);

    if (!userAccount) {
      return { success: false, error: "auth.invalid_code" };
    }

    const loginCode = await LoginCode.findLatestActiveCode(
      userAccount.persistedId,
      email,
    );

    if (!loginCode) {
      return { success: false, error: "auth.invalid_code" };
    }

    if (
      !verifyStoredLoginCode(
        email,
        code,
        loginCode.data.codeHash,
      )
    ) {
      return { success: false, error: "auth.invalid_code" };
    }

    await LoginCode.consumeActiveCodesForEmail(userAccount.persistedId, email);
    await createSession(userAccount.persistedId, generateSessionToken());

    return { success: true };
  } catch (error) {
    console.error("Failed to verify login code:", error);
    return { success: false, error: "auth.verify_failed" };
  }
}

// Delete/Archive
export async function logout(): Promise<void> {
  await clearCurrentSession();
  redirect("/login");
}
