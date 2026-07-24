import { prisma } from "./db";
import { KONFIG } from "./config";

export type Pembayaran = {
  bank: string;
  noRekening: string;
  atasNama: string;
  whatsapp: string;
  qrisImage: string;
};

export type Settings = Pembayaran & { target: number };

const DEFAULTS: Settings = {
  bank: KONFIG.pembayaran.bank,
  noRekening: KONFIG.pembayaran.noRekening,
  atasNama: KONFIG.pembayaran.atasNama,
  whatsapp: KONFIG.pembayaran.whatsapp,
  qrisImage: KONFIG.pembayaran.qrisImage,
  target: KONFIG.danaTarget,
};

const KEYS: (keyof Settings)[] = ["bank", "noRekening", "atasNama", "whatsapp", "qrisImage", "target"];

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
