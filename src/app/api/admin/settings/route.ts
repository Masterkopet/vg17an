import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { getSettings, setSettings, type Settings } from "@/lib/settings";
import { parseAmount } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeWa(s: string): string {
  let d = String(s).replace(/\D/g, "");
  if (d.startsWith("0")) d = "62" + d.slice(1);
  else if (d.startsWith("8")) d = "62" + d;
  return d;
}

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ ok: false }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const partial: Partial<Settings> = {};
  for (const k of ["bank", "noRekening", "atasNama", "qrisImage"] as const) {
    if (typeof b[k] === "string") partial[k] = (b[k] as string).trim().slice(0, 500);
  }
  if (typeof b.whatsapp === "string") partial.whatsapp = normalizeWa(b.whatsapp);
  if (b.target !== undefined && b.target !== "") partial.target = parseAmount(b.target);
  // Chat id Telegram: angka (boleh negatif untuk grup), dipisah koma.
  for (const k of ["bendaharaChatIds", "backupChatIds"] as const) {
    if (typeof b[k] === "string") {
      partial[k] = (b[k] as string)
        .split(",")
        .map((x) => x.trim())
        .filter((x) => /^-?\d+$/.test(x))
        .join(",");
    }
  }
  // Konten situs (teks bebas, dibatasi panjangnya)
  const MAXLEN: Record<string, number> = {
    tentang: 5000, kegiatan: 4000, panitia: 3000, rekeningLain: 1500,
    sponsorText: 3000, kontak: 1500,
  };
  for (const k of ["tentang", "kegiatan", "panitia", "rekeningLain", "sponsorText", "kontak"] as const) {
    if (typeof b[k] === "string") partial[k] = (b[k] as string).replace(/\r\n/g, "\n").trim().slice(0, MAXLEN[k]);
  }
  if (typeof b.kodeUnik === "string") partial.kodeUnik = (b.kodeUnik as string).replace(/\D/g, "").slice(0, 4);
  if (typeof b.sponsorWa === "string") partial.sponsorWa = (b.sponsorWa as string).trim() === "" ? "" : normalizeWa(b.sponsorWa as string);
  if (typeof b.sponsorUrl === "string") {
    const u = (b.sponsorUrl as string).trim().slice(0, 300);
    partial.sponsorUrl = u === "" || /^https?:\/\//i.test(u) ? u : "";
  }

  await setSettings(partial);
  return NextResponse.json({ ok: true, settings: await getSettings() });
}
