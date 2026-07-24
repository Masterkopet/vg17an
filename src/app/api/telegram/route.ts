import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPublicData } from "@/lib/data";
import { rupiah, parseAmount } from "@/lib/format";
import { isAdmin, tgSend, tgEdit, tgAnswerCallback, escapeHtml } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HELP =
  "🛠 <b>Perintah bendahara</b>\n\n" +
  "<code>/keluar &lt;jumlah&gt; &lt;keterangan&gt;</code> — catat pengeluaran\n" +
  "   contoh: <code>/keluar 2750000 Sewa Tenda</code>\n" +
  "<code>/batalkeluar &lt;id&gt;</code> — hapus pengeluaran\n" +
  "<code>/rekap</code> — ringkasan dana\n" +
  "<code>/id</code> — lihat chat id Anda";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let update: any;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  try {
    if (update.callback_query) await handleCallback(update.callback_query);
    else if (update.message?.text) await handleMessage(update.message);
  } catch (e) {
    console.error("[telegram] webhook error", e);
  }
  // Selalu 200 supaya Telegram tidak retry berulang.
  return NextResponse.json({ ok: true });
}

async function handleCallback(cq: any) {
  const fromId = cq.from?.id;
  const data: string = cq.data || "";
  const msg = cq.message;

  if (!isAdmin(fromId)) {
    await tgAnswerCallback(cq.id, "Anda tidak berwenang.");
    return;
  }
  const [action, idStr] = data.split(":");
  const id = Number(idStr);
  if (!id || (action !== "approve" && action !== "reject")) {
    await tgAnswerCallback(cq.id);
    return;
  }
  const donation = await prisma.donation.findUnique({ where: { id } });
  if (!donation) {
    await tgAnswerCallback(cq.id, "Data tidak ditemukan.");
    return;
  }
  if (donation.status !== "pending") {
    await tgAnswerCallback(cq.id, donation.status === "approved" ? "Sudah diterima." : "Sudah ditolak.");
    return;
  }

  const status = action === "approve" ? "approved" : "rejected";
  await prisma.donation.update({ where: { id }, data: { status, decidedAt: new Date() } });
  await tgAnswerCallback(cq.id, status === "approved" ? "✅ Donasi diterima" : "❌ Donasi ditolak");

  const nama = donation.name || "(tanpa nama)";
  const label = status === "approved" ? "✅ <b>DITERIMA</b>" : "❌ <b>DITOLAK</b>";
  if (msg) {
    await tgEdit(
      msg.chat.id,
      msg.message_id,
      `${label}\n\n👤 ${escapeHtml(nama)}\n💰 <b>${rupiah(donation.amount)}</b>`
    );
  }
}

async function handleMessage(msg: any) {
  const chatId = msg.chat?.id;
  const fromId = msg.from?.id;
  const text: string = (msg.text || "").trim();

  // Perintah publik
  if (text === "/id" || text.startsWith("/id ") || text.startsWith("/id@")) {
    await tgSend(chatId, `Chat id Anda: <code>${chatId}</code>\n\nTempel ke Environment Variable <code>TELEGRAM_ADMIN_CHAT_IDS</code> di Coolify, lalu redeploy.`);
    return;
  }
  if (text === "/start" || text.startsWith("/start")) {
    await tgSend(
      chatId,
      "🇮🇩 Bot Donasi HUT RI ke-81 Villa Gardenia.\n\nKirim <code>/id</code> untuk melihat chat id Anda.\nKirim <code>/help</code> untuk daftar perintah bendahara."
    );
    return;
  }
  if (text === "/help") {
    await tgSend(chatId, HELP);
    return;
  }

  // Perintah khusus bendahara (admin)
  const admin = isAdmin(fromId) || isAdmin(chatId);
  if (!admin) return; // abaikan diam-diam untuk non-admin

  if (text.startsWith("/keluar")) {
    const m = text.match(/^\/keluar(?:@\w+)?\s+(\S+)\s+([\s\S]+)$/);
    if (!m) {
      await tgSend(chatId, "Format: <code>/keluar &lt;jumlah&gt; &lt;keterangan&gt;</code>\nContoh: <code>/keluar 2750000 Sewa Tenda</code>");
      return;
    }
    const amount = parseAmount(m[1]);
    const desc = m[2].trim().slice(0, 100);
    if (amount < 1) {
      await tgSend(chatId, "Jumlah tidak valid. Contoh: <code>/keluar 2750000 Sewa Tenda</code>");
      return;
    }
    const exp = await prisma.expense.create({ data: { amount, description: desc } });
    await tgSend(chatId, `✅ Pengeluaran dicatat (#${exp.id}):\n${escapeHtml(desc)} — <b>${rupiah(amount)}</b>`);
    return;
  }

  if (text.startsWith("/batalkeluar")) {
    const id = Number(text.replace(/^\/batalkeluar(?:@\w+)?/, "").trim());
    if (!id) {
      await tgSend(chatId, "Format: <code>/batalkeluar &lt;id&gt;</code> (lihat id di pesan konfirmasi).");
      return;
    }
    const exp = await prisma.expense.findUnique({ where: { id } });
    if (!exp) {
      await tgSend(chatId, `Pengeluaran #${id} tidak ditemukan.`);
      return;
    }
    await prisma.expense.delete({ where: { id } });
    await tgSend(chatId, `🗑 Pengeluaran #${id} dihapus (${escapeHtml(exp.description)} — ${rupiah(exp.amount)}).`);
    return;
  }

  if (text.startsWith("/rekap")) {
    const d = await getPublicData();
    const pending = await prisma.donation.count({ where: { status: "pending" } });
    await tgSend(
      chatId,
      `📊 <b>Rekap Dana</b>\n\n` +
        `Terkumpul: <b>${rupiah(d.totalPemasukan)}</b>\n` +
        `Pengeluaran: ${rupiah(d.totalPengeluaran)}\n` +
        `Saldo: <b>${rupiah(d.saldo)}</b>\n` +
        `Target: ${rupiah(d.target)} (${Math.round(d.pctReal)}%)\n` +
        `Donatur: ${d.jumlahDonatur}\n` +
        `Menunggu verifikasi: ${pending}`
    );
    return;
  }
}
