import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { isAuthed } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPublicData } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fmt(d: Date): string {
  return new Date(d).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ ok: false }, { status: 401 });

  const [donations, expenses, summary] = await Promise.all([
    prisma.donation.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.expense.findMany({ orderBy: { date: "desc" } }),
    getPublicData(),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Villa Gardenia 17-an";

  const sr = wb.addWorksheet("Ringkasan");
  sr.getColumn(1).width = 32;
  sr.getColumn(2).width = 18;
  sr.getColumn(2).numFmt = "#,##0";
  sr.addRow(["Laporan Keuangan — HUT RI ke-81 Villa Gardenia"]).font = { bold: true, size: 14 };
  sr.addRow([]);
  sr.addRow(["Total Pemasukan (donasi diterima)", summary.totalPemasukan]);
  sr.addRow(["Total Pengeluaran", summary.totalPengeluaran]);
  sr.addRow(["Saldo", summary.saldo]);
  sr.addRow(["Target Dana", summary.target]);
  sr.addRow(["Jumlah Donatur", summary.jumlahDonatur]);
  sr.addRow(["Diunduh", fmt(new Date())]);

  const sd = wb.addWorksheet("Donasi");
  sd.columns = [
    { header: "Tanggal", key: "tgl", width: 20 },
    { header: "Nama", key: "nama", width: 32 },
    { header: "Nominal", key: "amount", width: 16, style: { numFmt: "#,##0" } },
    { header: "Status", key: "status", width: 12 },
    { header: "Catatan", key: "note", width: 30 },
  ];
  sd.getRow(1).font = { bold: true };
  donations.forEach((d) =>
    sd.addRow({ tgl: fmt(d.createdAt), nama: d.name || "Hamba Allah", amount: d.amount, status: d.status, note: d.note || "" })
  );

  const se = wb.addWorksheet("Pengeluaran");
  se.columns = [
    { header: "Tanggal", key: "tgl", width: 20 },
    { header: "Keterangan", key: "ket", width: 40 },
    { header: "Jumlah", key: "amount", width: 16, style: { numFmt: "#,##0" } },
  ];
  se.getRow(1).font = { bold: true };
  expenses.forEach((e) => se.addRow({ tgl: fmt(e.date), ket: e.description, amount: e.amount }));

  const buf = await wb.xlsx.writeBuffer();
  const body = Buffer.from(buf as ArrayBuffer);
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="laporan-vg17an-${stamp}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
