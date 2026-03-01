"use server";

import { redirect } from "next/navigation";

import {
  generateLoginCode,
  generateSessionToken,
  isDevAdminEmail,
  isDevelopmentAuthBypassEnabled,
  isValidDevAdminCode,
  hashLoginCode,
  isValidEmail,
  normalizeEmail,
  verifyLoginCode as verifyStoredLoginCode,
} from "@/lib/auth";
import { sendLoginCodeEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { clearCurrentSession, createSession } from "@/lib/session";

type AuthResult = {
  success: boolean;
  error?: string;
};

export async function requestLoginCode(input: {
  email: string;
}): Promise<AuthResult> {
  const email = normalizeEmail(input.email);

  if (!isValidEmail(email)) {
    return { success: false, error: "auth.invalid_email" };
  }

  try {
    if (isDevelopmentAuthBypassEnabled() && isDevAdminEmail(email)) {
      await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          name: "Admin",
        },
      });

      return { success: true };
    }

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email },
    });

    await prisma.loginCode.updateMany({
      where: {
        userId: user.id,
        email,
        consumedAt: null,
      },
      data: {
        consumedAt: new Date(),
      },
    });

    const code = generateLoginCode();
    const loginCode = await prisma.loginCode.create({
      data: {
        userId: user.id,
        email,
        codeHash: hashLoginCode(email, code),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    try {
      await sendLoginCodeEmail({ to: email, code });
    } catch (error) {
      console.error("Failed to send login code email:", error);
      await prisma.loginCode.delete({
        where: { id: loginCode.id },
      });
      return { success: false, error: "auth.email_send_failed" };
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to request login code:", error);
    return { success: false, error: "auth.request_failed" };
  }
}

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
      const adminUser = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          name: "Admin",
        },
      });

      await createSession(adminUser.id, generateSessionToken());

      return { success: true };
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, error: "auth.invalid_code" };
    }

    const loginCode = await prisma.loginCode.findFirst({
      where: {
        userId: user.id,
        email,
        consumedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!loginCode) {
      return { success: false, error: "auth.invalid_code" };
    }

    if (!verifyStoredLoginCode(email, code, loginCode.codeHash)) {
      return { success: false, error: "auth.invalid_code" };
    }

    await prisma.loginCode.updateMany({
      where: {
        userId: user.id,
        email,
        consumedAt: null,
      },
      data: {
        consumedAt: new Date(),
      },
    });

    await createSession(user.id, generateSessionToken());

    return { success: true };
  } catch (error) {
    console.error("Failed to verify login code:", error);
    return { success: false, error: "auth.verify_failed" };
  }
}

export async function logout(): Promise<void> {
  await clearCurrentSession();
  redirect("/login");
}
