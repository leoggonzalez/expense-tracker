import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { hashSessionToken, SESSION_TTL_MS } from "@/lib/auth";
import {
  SessionRecord,
  type SessionWithUserAccountRecord,
} from "@/lib/session_record";

const SESSION_COOKIE_NAME = "expense_tracker_session";

async function getCookieStore() {
  return cookies();
}

export async function createSession(
  userAccountId: string,
  token: string,
): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await new SessionRecord({
    userAccountId,
    sessionTokenHash: hashSessionToken(token),
    expiresAt,
    createdAt: new Date(),
  }).create();

  const cookieStore = await getCookieStore();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function getCurrentSession(): Promise<SessionWithUserAccountRecord | null> {
  const cookieStore = await getCookieStore();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  const session = await SessionRecord.findByTokenHashWithUserAccount(
    hashSessionToken(sessionToken),
  );

  if (!session) {
    return null;
  }

  if (session.expiresAt <= new Date()) {
    await new SessionRecord(session).delete();
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
    await SessionRecord.deleteByTokenHash(hashSessionToken(sessionToken));
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}
