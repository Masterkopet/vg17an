import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getPublicData } from "@/lib/data";
import AdminDashboard from "@/components/AdminDashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAuthed())) redirect("/admin/login");

  const [settings, donations, expenses, summary, pending] = await Promise.all([
    getSettings(),
    prisma.donation.findMany({ orderBy: [{ createdAt: "desc" }, { id: "desc" }] }),
    prisma.expense.findMany({ orderBy: [{ date: "desc" }, { id: "desc" }] }),
    getPublicData(),
    prisma.donation.count({ where: { status: "pending" } }),
  ]);

  return (
    <main className="min-h-screen bg-surface-container-low">
      <AdminDashboard
        settings={settings}
        donations={donations.map((d) => ({
          id: d.id,
          name: d.name,
          amount: d.amount,
          status: d.status,
          note: d.note,
          createdAt: d.createdAt.toISOString(),
        }))}
        expenses={expenses.map((e) => ({
          id: e.id,
          description: e.description,
          amount: e.amount,
          date: e.date.toISOString(),
        }))}
        summary={{
          totalPemasukan: summary.totalPemasukan,
          totalPengeluaran: summary.totalPengeluaran,
          saldo: summary.saldo,
          jumlahDonatur: summary.jumlahDonatur,
          pending,
        }}
      />
    </main>
  );
}
