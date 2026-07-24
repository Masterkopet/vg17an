import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rupiah } from "@/lib/format";
import { tgSendToAdmins, telegramConfigured, escapeHtml } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { name?: unknown; amount?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Permintaan tidak valid" }, { status: 400 });
  }

  const amount = Math.round(Number(body.amount));
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 60) : "";

  if (!Number.isFinite(amount) || amount < 1000) {
    return NextResponse.json({ ok: false, error: "Nominal minimal Rp 1.000" }, { status: 400 });
  }
  if (amount > 1_000_000_000) {
    return NextResponse.json({ ok: false, error: "Nominal terlalu besar" }, { status: 400 });
  }

  const donation = await prisma.donation.create({
    data: { name: name || null, amount, status: "pending" },
  });

  if (telegramConfigured()) {
    const text =
      `🔔 <b>Donasi baru — menunggu verifikasi</b>\n\n` +
      `👤 ${escapeHtml(name || "(tanpa nama)")}\n` +
      `💰 <b>${rupiah(amount)}</b>\n\n` +
      `Silakan cek rekening, lalu tekan tombol di bawah:`;
    const keyboard = {
      inline_keyboard: [
        [
          { text: "✅ Terima", callback_data: `approve:${donation.id}` },
          { text: "❌ Tolak", callback_data: `reject:${donation.id}` },
        ],
      ],
    };
    const results = await tgSendToAdmins(text, keyboard);
    const first = results.find((r) => r && r.ok && r.result);
    if (first?.result) {
      await prisma.donation.update({
        where: { id: donation.id },
        data: { tgChatId: String(first.result.chat.id), tgMessageId: String(first.result.message_id) },
      });
    }
  }

  return NextResponse.json({ ok: true, id: donation.id });
}
