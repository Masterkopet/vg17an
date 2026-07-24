import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { buildLaporanWorkbook } from "@/lib/excel";
import { wibDate } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await buildLaporanWorkbook();
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="laporan-vg17an-${wibDate()}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
