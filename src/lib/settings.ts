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
  // ---- Konten situs (semua diedit dari Admin Panel) ----
  tentang: string;      // narasi "Tentang" — paragraf dipisah baris kosong
  kegiatan: string;     // per baris: Tanggal | Judul | Deskripsi
  panitia: string;      // per baris: Nama | Jabatan
  rekeningLain: string; // rekening tambahan, per baris: Bank | Nomor | Atas Nama
  kodeUnik: string;     // kode unik 3 digit di akhir nominal (kosong = tidak dipakai)
  sponsorText: string;  // narasi sponsorship (kosong = seksi disembunyikan)
  sponsorWa: string;    // WA koordinator sponsorship (62...)
  sponsorUrl: string;   // tautan proposal mitra (opsional)
  kontak: string;       // per baris: Nama | 62xxxx (tombol WA di bagian kontak)
};

function envIds(name: string): string {
  return (process.env[name] || "").trim();
}

const DEFAULT_TENTANG =
  "Dalam rangka memperingati Hari Ulang Tahun Kemerdekaan Republik Indonesia, Paguyuban Villa Gardenia kembali menunjukkan semangat kebangsaan dengan memeriahkan HUT RI sejak tahun 2023. Berbagai kegiatan seperti lomba tradisional hingga pementasan seni telah sukses menciptakan rasa kebersamaan dan kekompakan antar warga.\n\n" +
  "Tahun ini kami berkomitmen menggelar perayaan yang lebih meriah dan berkesan. Untuk mewujudkannya, kami mengajak seluruh warga Villa Gardenia dan para donatur untuk turut serta memberikan dukungan. Dengan gotong royong dan semangat persatuan, perayaan HUT RI ke-81 akan menjadi momen yang tak terlupakan dan memperkuat ikatan bermasyarakat. Mari bersama kita tunjukkan semangat 45 yang masih menyala!";

const DEFAULT_KEGIATAN =
  "17 Agustus | Lomba Anak-anak | Beragam lomba tradisional yang mendidik dan menyenangkan untuk anak-anak di lingkungan kita.\n" +
  "16 Agustus | Malam Tirakatan | Malam renungan dan doa bersama sebagai wujud syukur atas kemerdekaan bangsa.\n" +
  "18 Agustus | Pawai Budaya | Puncak acara berupa karnaval keliling perumahan menampilkan kreativitas warga.";

const DEFAULTS: Settings = {
  bank: KONFIG.pembayaran.bank,
  noRekening: KONFIG.pembayaran.noRekening,
  atasNama: KONFIG.pembayaran.atasNama,
  whatsapp: KONFIG.pembayaran.whatsapp,
  qrisImage: KONFIG.pembayaran.qrisImage,
  target: KONFIG.danaTarget,
  bendaharaChatIds: "",
  backupChatIds: "",
  tentang: DEFAULT_TENTANG,
  kegiatan: DEFAULT_KEGIATAN,
  panitia: "",
  rekeningLain: "",
  kodeUnik: "",
  sponsorText: "",
  sponsorWa: "",
  sponsorUrl: "",
  kontak: "",
};

const KEYS: (keyof Settings)[] = [
  "bank", "noRekening", "atasNama", "whatsapp", "qrisImage", "target",
  "bendaharaChatIds", "backupChatIds",
  "tentang", "kegiatan", "panitia", "rekeningLain", "kodeUnik",
  "sponsorText", "sponsorWa", "sponsorUrl", "kontak",
];

export async function getSettings(): Promise<Settings> {
  const rows = await prisma.setting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const out = {} as Settings;
  for (const key of KEYS) {
    if (key === "target") continue;
    (out as Record<string, unknown>)[key] = map.get(key) ?? DEFAULTS[key];
  }
  out.target = map.has("target") ? Number(map.get("target")) || DEFAULTS.target : DEFAULTS.target;
  return out;
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
