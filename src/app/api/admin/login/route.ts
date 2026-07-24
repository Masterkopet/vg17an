import { NextRequest, NextResponse } from "next/server";
import { checkPassword, makeToken, COOKIE_NAME, COOKIE_MAX_AGE } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { password?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    /* ignore */
  }
  if (!checkPassword(String(body.password ?? ""))) {
    return NextResponse.json({ ok: false, error: "Password salah atau admin belum diaktifkan." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, makeToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return res;
}
