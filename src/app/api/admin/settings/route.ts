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

  await setSettings(partial);
  return NextResponse.json({ ok: true, settings: await getSettings() });
}
