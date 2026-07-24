import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rupiah } from "@/lib/format";
import { tgEditAny, escapeHtml } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ ok: false }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { id?: unknown; action?: unknown };
  const id = Number(b.id);
  const action = String(b.action || "");
  if (!id) return NextResponse.json({ ok: false, error: "id tidak valid" }, { status: 400 });

  const donation = await prisma.donation.findUnique({ where: { id } });
  if (!donation) return NextResponse.json({ ok: false, error: "Tidak ditemukan" }, { status: 404 });

  if (action === "delete") {
    await prisma.donation.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }
  if (action === "approve" || action === "reject") {
    const status = action === "approve" ? "approved" : "rejected";
    await prisma.donation.update({ where: { id }, data: { status, decidedAt: new Date() } });
    // Sinkronkan pesan Telegram (bila ada) agar tombolnya hilang.
    if (donation.tgChatId && donation.tgMessageId) {
      const label = status === "approved" ? "✅ <b>DITERIMA</b> (via admin web)" : "❌ <b>DITOLAK</b> (via admin web)";
      tgEditAny(donation.tgChatId, donation.tgMessageId, `${label}\n\n👤 ${escapeHtml(donation.name || "(tanpa nama)")}\n💰 <b>${rupiah(donation.amount)}</b>`).catch(() => {});
    }
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false, error: "Aksi tidak dikenal" }, { status: 400 });
}
