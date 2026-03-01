import {
  createHash,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from "node:crypto";

const DEFAULT_AUTH_SECRET = "development-auth-secret";
const LOGIN_CODE_LENGTH = 6;

export const LOGIN_CODE_TTL_MS = 10 * 60 * 1000;
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function getAuthSecret(): string {
  return process.env.AUTH_SECRET || DEFAULT_AUTH_SECRET;
}

function createDigest(value: string): Buffer {
  return createHash("sha256").update(`${getAuthSecret()}:${value}`).digest();
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function generateLoginCode(): string {
  return randomInt(0, 10 ** LOGIN_CODE_LENGTH)
    .toString()
    .padStart(LOGIN_CODE_LENGTH, "0");
}

export function hashLoginCode(email: string, code: string): string {
  return createDigest(`${normalizeEmail(email)}:${code}`).toString("hex");
}

export function verifyLoginCode(
  email: string,
  code: string,
  codeHash: string,
): boolean {
  const expected = Buffer.from(hashLoginCode(email, code), "hex");
  const actual = Buffer.from(codeHash, "hex");

  if (expected.length !== actual.length) {
    return false;
  }

  return timingSafeEqual(expected, actual);
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string): string {
  return createDigest(token).toString("hex");
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isDevelopmentAuthBypassEnabled(): boolean {
  return Boolean(process.env.DEV_ADMIN_EMAIL);
}

export function getDevAdminCode(): string {
  return process.env.DEV_ADMIN_LOGIN_CODE || "999999";
}

export function isDevAdminEmail(email: string): boolean {
  const adminEmail = process.env.DEV_ADMIN_EMAIL;

  if (!adminEmail) {
    return false;
  }

  return normalizeEmail(email) === normalizeEmail(adminEmail);
}

export function isValidDevAdminCode(email: string, code: string): boolean {
  return (
    isDevelopmentAuthBypassEnabled() &&
    isDevAdminEmail(email) &&
    code === getDevAdminCode()
  );
}
