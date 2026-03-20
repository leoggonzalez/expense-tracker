import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { hashSessionToken, SESSION_TTL_MS } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE_NAME = "expense_tracker_session";

type SessionWithUserAccount = {
  id: string;
  userAccountId: string;
  expiresAt: Date;
  userAccount: {
    id: string;
    email: string;
    name: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
};

async function getCookieStore() {
  return cookies();
}

export async function createSession(
  userAccountId: string,
  token: string,
): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: {
      userAccountId,
      sessionTokenHash: hashSessionToken(token),
      expiresAt,
    },
  });

  const cookieStore = await getCookieStore();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function getCurrentSession(): Promise<SessionWithUserAccount | null> {
  const cookieStore = await getCookieStore();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: {
      sessionTokenHash: hashSessionToken(sessionToken),
    },
    include: {
      userAccount: true,
    },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt <= new Date()) {
    await prisma.session.delete({
      where: {
        id: session.id,
      },
    });
    return null;
  }

  return session;
}

export async function getCurrentUserAccount() {
  const session = await getCurrentSession();

  return session?.userAccount ?? null;
}

export async function requireCurrentUserAccount() {
  const userAccount = await getCurrentUserAccount();

  if (!userAccount) {
    redirect("/login");
  }

  return userAccount;
}

export async function requireAnonymous() {
  const userAccount = await getCurrentUserAccount();

  if (userAccount) {
    redirect("/");
  }
}

export async function clearCurrentSession(): Promise<void> {
  const cookieStore = await getCookieStore();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    await prisma.session.deleteMany({
      where: {
        sessionTokenHash: hashSessionToken(sessionToken),
      },
    });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}
