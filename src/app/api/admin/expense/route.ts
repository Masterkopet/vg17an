import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseAmount } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ ok: false }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { action?: unknown; id?: unknown; description?: unknown; amount?: unknown; date?: unknown };
  const action = String(b.action || "add");

  if (action === "delete") {
    const id = Number(b.id);
    if (!id) return NextResponse.json({ ok: false, error: "id tidak valid" }, { status: 400 });
    await prisma.expense.delete({ where: { id } }).catch(() => {});
    return NextResponse.json({ ok: true });
  }

  // add
  const description = String(b.description || "").trim().slice(0, 120);
  const amount = parseAmount(b.amount);
  if (!description || amount < 1) {
    return NextResponse.json({ ok: false, error: "Keterangan & jumlah wajib diisi dengan benar" }, { status: 400 });
  }
  const date = b.date && !isNaN(new Date(String(b.date)).getTime()) ? new Date(String(b.date)) : new Date();
  const exp = await prisma.expense.create({ data: { description, amount, date } });
  return NextResponse.json({ ok: true, id: exp.id });
}
