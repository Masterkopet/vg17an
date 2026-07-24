import { rupiah } from "./format";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const API = TOKEN ? `https://api.telegram.org/bot${TOKEN}` : "";

export function telegramConfigured(): boolean {
  return !!TOKEN;
}

// Fallback berbasis env (daftar utama kini dikelola di Admin Panel — lihat lib/settings.ts).
export function adminChatIds(): string[] {
  return (process.env.TELEGRAM_ADMIN_CHAT_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function escapeHtml(s: unknown): string {
  return String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
}

async function call(method: string, body: Record<string, unknown>): Promise<any> {
  if (!API) return { ok: false, error: "TELEGRAM_BOT_TOKEN belum diset" };
  try {
    const res = await fetch(`${API}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

async function callForm(method: string, form: FormData): Promise<any> {
  if (!API) return { ok: false, error: "TELEGRAM_BOT_TOKEN belum diset" };
  try {
    const res = await fetch(`${API}/${method}`, { method: "POST", body: form });
    return await res.json();
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export function tgSend(chatId: string | number, text: string, replyMarkup?: unknown): Promise<any> {
  return call("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

export function tgSendPhoto(
  chatId: string | number,
  photo: Uint8Array<ArrayBuffer>,
  mime: string,
  caption: string,
  replyMarkup?: unknown
): Promise<any> {
  const form = new FormData();
  form.append("chat_id", String(chatId));
  form.append("caption", caption);
  form.append("parse_mode", "HTML");
  if (replyMarkup) form.append("reply_markup", JSON.stringify(replyMarkup));
  form.append("photo", new Blob([photo], { type: mime }), "bukti.jpg");
  return callForm("sendPhoto", form);
}

export function tgSendDocument(
  chatId: string | number,
  filename: string,
  buffer: Uint8Array<ArrayBuffer>,
  caption?: string,
  mime = "application/octet-stream"
): Promise<any> {
  const form = new FormData();
  form.append("chat_id", String(chatId));
  if (caption) form.append("caption", caption);
  form.append("document", new Blob([buffer], { type: mime }), filename);
  return callForm("sendDocument", form);
}

const EMPTY_KB = { inline_keyboard: [] as unknown[] };

export function tgEdit(chatId: string | number, messageId: string | number, text: string, replyMarkup?: unknown): Promise<any> {
  return call("editMessageText", {
    chat_id: chatId,
    message_id: Number(messageId),
    text,
    parse_mode: "HTML",
    reply_markup: replyMarkup ?? EMPTY_KB,
  });
}

export function tgEditCaption(chatId: string | number, messageId: string | number, caption: string, replyMarkup?: unknown): Promise<any> {
  return call("editMessageCaption", {
    chat_id: chatId,
    message_id: Number(messageId),
    caption,
    parse_mode: "HTML",
    reply_markup: replyMarkup ?? EMPTY_KB,
  });
}

// Edit pesan notifikasi tanpa perlu tahu apakah pesan itu teks atau foto:
// coba editMessageText dulu, bila gagal (pesan foto) pakai editMessageCaption.
export async function tgEditAny(chatId: string | number, messageId: string | number, text: string, replyMarkup?: unknown): Promise<any> {
  const r = await tgEdit(chatId, messageId, text, replyMarkup);
  if (r && r.ok) return r;
  return tgEditCaption(chatId, messageId, text, replyMarkup);
}

export function tgAnswerCallback(callbackQueryId: string, text?: string): Promise<any> {
  return call("answerCallbackQuery", { callback_query_id: callbackQueryId, ...(text ? { text } : {}) });
}

export function tgSetWebhook(url: string, secret: string): Promise<any> {
  return call("setWebhook", {
    url,
    secret_token: secret,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: true,
  });
}

export function tgGetWebhookInfo(): Promise<any> {
  return call("getWebhookInfo", {});
}

/* ---------- Teks & keyboard notifikasi donasi ---------- */

export function donationNotifText(name: string | null | undefined, amount: number, hasProof: boolean): string {
  return (
    `🔔 <b>Donasi baru — menunggu verifikasi</b>\n\n` +
    `👤 ${escapeHtml(name || "(tanpa nama)")}\n` +
    `💰 <b>${rupiah(amount)}</b>\n` +
    (hasProof ? `📎 Bukti transfer terlampir di atas.\n` : `📎 Tanpa bukti terlampir.\n`) +
    `\nSilakan cek rekening, lalu tekan tombol di bawah:`
  );
}

export function donationKeyboard(id: number) {
  return {
    inline_keyboard: [[
      { text: "✅ Terima", callback_data: `approve:${id}` },
      { text: "❌ Tolak", callback_data: `reject:${id}` },
    ]],
  };
}

export function confirmRejectKeyboard(id: number) {
  return {
    inline_keyboard: [[
      { text: "⚠️ Ya, Tolak Donasi Ini", callback_data: `rejectyes:${id}` },
    ], [
      { text: "↩️ Kembali", callback_data: `back:${id}` },
    ]],
  };
}
