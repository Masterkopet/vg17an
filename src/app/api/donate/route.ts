import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  telegramConfigured,
  tgSend,
  tgSendPhoto,
  donationNotifText,
  donationKeyboard,
} from "@/lib/telegram";
import { getBendaharaChatIds } from "@/lib/settings";
import { saveUpload } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Anti-spam sederhana per-IP: cegah bendahara dibanjiri notifikasi palsu.
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const WINDOW = 10 * 60 * 1000;
  const MAX = 8;
  const arr = (hits.get(ip) || []).filter((t) => now - t < WINDOW);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) for (const [k, v] of hits) if (v.every((t) => now - t > WINDOW)) hits.delete(k);
  return arr.length > MAX;
}

const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_PROOF_BYTES = 5 * 1024 * 1024; // 5 MB

type Parsed = { name: string; amount: number; proof: { data: Uint8Array<ArrayBuffer>; mime: string; ext: string } | null };

async function parseRequest(req: NextRequest): Promise<Parsed | { error: string }> {
  const ct = req.headers.get("content-type") || "";

  if (ct.includes("multipart/form-data")) {
    const form = await req.formData().catch(() => null);
    if (!form) return { error: "Permintaan tidak valid" };
    const name = String(form.get("name") || "").trim().slice(0, 60);
    const amount = Math.round(Number(form.get("amount")));
    const file = form.get("proof");
    let proof: Parsed["proof"] = null;
    if (file instanceof File && file.size > 0) {
      const ext = ALLOWED_MIME[file.type];
      if (!ext) return { error: "Bukti harus berupa gambar JPG, PNG, atau WebP" };
      if (file.size > MAX_PROOF_BYTES) return { error: "Ukuran bukti maksimal 5 MB" };
      const buf = new Uint8Array(await file.arrayBuffer()) as Uint8Array<ArrayBuffer>;
      proof = { data: buf, mime: file.type, ext };
    }
    return { name, amount, proof };
  }

  const body = (await req.json().catch(() => null)) as { name?: unknown; amount?: unknown } | null;
  if (!body) return { error: "Permintaan tidak valid" };
  return {
    name: typeof body.name === "string" ? body.name.trim().slice(0, 60) : "",
    amount: Math.round(Number(body.amount)),
    proof: null,
  };
}

export async function POST(req: NextRequest) {
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "Terlalu banyak percobaan. Coba lagi beberapa menit lagi." }, { status: 429 });
  }

  const parsed = await parseRequest(req);
  if ("error" in parsed) return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });

  const { name, amount, proof } = parsed;
  if (!Number.isFinite(amount) || amount < 1000) {
    return NextResponse.json({ ok: false, error: "Nominal minimal Rp 1.000" }, { status: 400 });
  }
  if (amount > 1_000_000_000) {
    return NextResponse.json({ ok: false, error: "Nominal terlalu besar" }, { status: 400 });
  }

  const donation = await prisma.donation.create({
    data: { name: name || null, amount, status: "pending" },
  });

  // Simpan bukti di volume (arsip, tidak pernah tampil publik).
  if (proof) {
    try {
      const filename = `bukti-${donation.id}.${proof.ext}`;
      await saveUpload(filename, proof.data);
      await prisma.donation.update({ where: { id: donation.id }, data: { proofFile: filename } });
    } catch (e) {
      console.error("[donate] gagal menyimpan bukti:", e);
    }
  }

  // Notifikasi ke bendahara: foto bukti (bila ada) + tombol Terima/Tolak.
  if (telegramConfigured()) {
    const ids = await getBendaharaChatIds();
    const text = donationNotifText(name, amount, !!proof);
    const keyboard = donationKeyboard(donation.id);
    let first: any = null;
    for (const id of ids) {
      const r = proof
        ? await tgSendPhoto(id, proof.data, proof.mime, text, keyboard)
        : await tgSend(id, text, keyboard);
      if (!first && r && r.ok && r.result) first = r;
    }
    if (first?.result) {
      await prisma.donation.update({
        where: { id: donation.id },
        data: { tgChatId: String(first.result.chat.id), tgMessageId: String(first.result.message_id) },
      });
    }
  }

  return NextResponse.json({ ok: true, id: donation.id, proofReceived: !!proof });
}
