import { prisma } from "./db";
import { KONFIG } from "./config";

export type Pembayaran = {
  bank: string;
  noRekening: string;
  atasNama: string;
  whatsapp: string;
  qrisImage: string;
};

export type Settings = Pembayaran & {
  target: number;
  // Chat id Telegram, dipisah koma. Bisa diubah dari Admin Panel tanpa redeploy.
  bendaharaChatIds: string; // penerima notif donasi + perintah bot
  backupChatIds: string;    // penerima auto-backup (arsip) — agar bendahara tak terganggu
};

function envIds(name: string): string {
  return (process.env[name] || "").trim();
}

const DEFAULTS: Settings = {
  bank: KONFIG.pembayaran.bank,
  noRekening: KONFIG.pembayaran.noRekening,
  atasNama: KONFIG.pembayaran.atasNama,
  whatsapp: KONFIG.pembayaran.whatsapp,
  qrisImage: KONFIG.pembayaran.qrisImage,
  target: KONFIG.danaTarget,
  bendaharaChatIds: "",
  backupChatIds: "",
};

const KEYS: (keyof Settings)[] = [
  "bank", "noRekening", "atasNama", "whatsapp", "qrisImage", "target",
  "bendaharaChatIds", "backupChatIds",
];

export async function getSettings(): Promise<Settings> {
  const rows = await prisma.setting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    bank: map.get("bank") ?? DEFAULTS.bank,
    noRekening: map.get("noRekening") ?? DEFAULTS.noRekening,
    atasNama: map.get("atasNama") ?? DEFAULTS.atasNama,
    whatsapp: map.get("whatsapp") ?? DEFAULTS.whatsapp,
    qrisImage: map.get("qrisImage") ?? DEFAULTS.qrisImage,
    target: map.has("target") ? Number(map.get("target")) || DEFAULTS.target : DEFAULTS.target,
    bendaharaChatIds: map.get("bendaharaChatIds") ?? DEFAULTS.bendaharaChatIds,
    backupChatIds: map.get("backupChatIds") ?? DEFAULTS.backupChatIds,
  };
}

export async function setSettings(partial: Partial<Settings>): Promise<void> {
  for (const key of KEYS) {
    const v = partial[key];
    if (v === undefined || v === null) continue;
    const value = String(v);
    await prisma.setting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }
}

/* ---------- Peran bot Telegram ---------- */

function parseIds(s: string): string[] {
  return String(s || "")
    .split(",")
    .map((x) => x.trim())
    .filter((x) => /^-?\d+$/.test(x));
}

// Bendahara: notif donasi + Terima/Tolak + perintah keuangan.
// Prioritas: pengaturan Admin Panel (DB) → env TELEGRAM_ADMIN_CHAT_IDS.
export async function getBendaharaChatIds(): Promise<string[]> {
  const s = await getSettings();
  const fromDb = parseIds(s.bendaharaChatIds);
  return fromDb.length ? fromDb : parseIds(envIds("TELEGRAM_ADMIN_CHAT_IDS"));
}

// Arsip backup: HANYA menerima file backup otomatis.
// Prioritas: DB → env TELEGRAM_BACKUP_CHAT_IDS. (Bila kosong, scheduler fallback ke bendahara.)
export async function getBackupChatIds(): Promise<string[]> {
  const s = await getSettings();
  const fromDb = parseIds(s.backupChatIds);
  return fromDb.length ? fromDb : parseIds(envIds("TELEGRAM_BACKUP_CHAT_IDS"));
}

export async function isBendahara(chatId: string | number | undefined | null): Promise<boolean> {
  if (chatId == null) return false;
  const ids = await getBendaharaChatIds();
  return ids.length > 0 && ids.includes(String(chatId));
}
