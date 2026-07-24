const TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const API = TOKEN ? `https://api.telegram.org/bot${TOKEN}` : "";

export function telegramConfigured(): boolean {
  return !!TOKEN;
}

export function adminChatIds(): string[] {
  return (process.env.TELEGRAM_ADMIN_CHAT_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isAdmin(chatId: string | number | undefined | null): boolean {
  if (chatId == null) return false;
  const ids = adminChatIds();
  return ids.length > 0 && ids.includes(String(chatId));
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

export function tgSend(chatId: string | number, text: string, replyMarkup?: unknown): Promise<any> {
  return call("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

export async function tgSendToAdmins(text: string, replyMarkup?: unknown): Promise<any[]> {
  const ids = adminChatIds();
  const out: any[] = [];
  for (const id of ids) out.push(await tgSend(id, text, replyMarkup));
  return out;
}

export function tgEdit(chatId: string | number, messageId: string | number, text: string): Promise<any> {
  return call("editMessageText", {
    chat_id: chatId,
    message_id: Number(messageId),
    text,
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: [] },
  });
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
