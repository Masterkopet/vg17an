import { cookies } from "next/headers";
import crypto from "node:crypto";

export const COOKIE_NAME = "vg_admin";
const TTL_MS = 7 * 24 * 3600 * 1000; // 7 hari
export const COOKIE_MAX_AGE = Math.floor(TTL_MS / 1000);

function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || "";
}
function signingKey(): string {
  return process.env.ADMIN_PASSWORD || process.env.TELEGRAM_WEBHOOK_SECRET || "insecure-dev-key";
}
function sign(value: string): string {
  return crypto.createHmac("sha256", signingKey()).update(value).digest("base64url");
}

export function adminEnabled(): boolean {
  return !!adminPassword();
}

export function checkPassword(input: string): boolean {
  const pw = adminPassword();
  if (!pw) return false;
  const a = crypto.createHash("sha256").update(String(input)).digest();
  const b = crypto.createHash("sha256").update(pw).digest();
  return crypto.timingSafeEqual(a, b);
}

export function makeToken(): string {
  const exp = String(Date.now() + TTL_MS);
  return `${exp}.${sign(exp)}`;
}

export function verifyToken(token?: string | null): boolean {
  if (!token || !adminEnabled()) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig) return false;
  if (!Number.isFinite(Number(exp)) || Number(exp) < Date.now()) return false;
  const expected = sign(exp);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function isAuthed(): Promise<boolean> {
  const store = await cookies();
  return verifyToken(store.get(COOKIE_NAME)?.value);
}
