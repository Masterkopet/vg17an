import { NextRequest, NextResponse } from "next/server";
import { tgSetWebhook, tgGetWebhookInfo } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Kunjungi sekali setelah deploy untuk mendaftarkan webhook Telegram:
//   https://17an.villagardenia.online/api/telegram/setup?secret=<TELEGRAM_WEBHOOK_SECRET>
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!expected || secret !== expected) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL || `${url.protocol}//${url.host}`;
  const webhookUrl = `${site.replace(/\/$/, "")}/api/telegram`;

  const set = await tgSetWebhook(webhookUrl, expected);
  const info = await tgGetWebhookInfo();

  return NextResponse.json({ webhookUrl, setWebhook: set, info });
}
