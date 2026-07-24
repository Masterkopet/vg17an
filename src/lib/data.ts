import { prisma } from "./db";
import { getSettings } from "./settings";

export type Donatur = { id: number; nama: string; jumlah: number; tanggal: string; catatan: string };
export type Pengeluaran = { id: number; keterangan: string; jumlah: number; tanggal: string };

export type PublicData = {
  donatur: Donatur[];
  pengeluaran: Pengeluaran[];
  totalPemasukan: number;
  totalPengeluaran: number;
  saldo: number;
  target: number;
  pctReal: number;
  sisa: number;
  jumlahDonatur: number;
  updatedAt: string;
};

export async function getPublicData(): Promise<PublicData> {
  const [donaturRows, pengeluaranRows] = await Promise.all([
    prisma.donation.findMany({ where: { status: "approved" }, orderBy: [{ decidedAt: "desc" }, { id: "desc" }] }),
    prisma.expense.findMany({ orderBy: [{ date: "desc" }, { id: "desc" }] }),
  ]);

  const donatur: Donatur[] = donaturRows.map((d) => ({
    id: d.id,
    nama: (d.name && d.name.trim()) || "Hamba Allah",
    jumlah: d.amount,
    tanggal: (d.decidedAt ?? d.createdAt).toISOString(),
    catatan: d.note ?? "",
  }));
  const pengeluaran: Pengeluaran[] = pengeluaranRows.map((e) => ({
    id: e.id,
    keterangan: e.description,
    jumlah: e.amount,
    tanggal: e.date.toISOString(),
  }));

  const totalPemasukan = donatur.reduce((a, d) => a + d.jumlah, 0);
  const totalPengeluaran = pengeluaran.reduce((a, d) => a + d.jumlah, 0);
  const target = (await getSettings()).target;
  const pctReal = target > 0 ? (totalPemasukan / target) * 100 : 0;

  return {
    donatur,
    pengeluaran,
    totalPemasukan,
    totalPengeluaran,
    saldo: totalPemasukan - totalPengeluaran,
    target,
    pctReal,
    sisa: Math.max(0, target - totalPemasukan),
    jumlahDonatur: donatur.length,
    updatedAt: new Date().toISOString(),
  };
}
