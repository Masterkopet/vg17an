"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { rupiah, tglID, waktuID } from "@/lib/format";

type Donation = { id: number; name: string | null; amount: number; status: string; note: string | null; createdAt: string };
type Expense = { id: number; description: string; amount: number; date: string };
type Settings = {
  bank: string;
  noRekening: string;
  atasNama: string;
  whatsapp: string;
  qrisImage: string;
  target: number;
  bendaharaChatIds: string;
  backupChatIds: string;
};
type Summary = { totalPemasukan: number; totalPengeluaran: number; saldo: number; jumlahDonatur: number; pending: number };

const card = "bg-surface-container-lowest border border-outline-variant rounded-2xl";
const input =
  "w-full rounded-xl border-0 py-3 px-4 text-on-surface ring-1 ring-inset ring-outline-variant focus:ring-2 focus:ring-inset focus:ring-primary font-body-md text-body-md bg-surface-container-lowest";
const btnPrimary = "inline-flex items-center justify-center gap-1 bg-primary text-on-primary font-label-md text-label-md px-5 py-2.5 rounded-full press disabled:opacity-50";
const btnGhost = "inline-flex items-center gap-1 border border-outline-variant text-on-surface font-label-md text-label-md px-4 py-2 rounded-full press hover:border-primary";

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, string> = {
    approved: "bg-[#e6f4ea] text-[#1e6b33] border border-[#b6ddc2]",
    pending: "bg-[#fff4d6] text-[#7a5f00] border border-[#f0d98a]",
    rejected: "bg-surface-container-high text-secondary border border-outline-variant",
  };
  const label: Record<string, string> = { approved: "Diterima", pending: "Menunggu", rejected: "Ditolak" };
  return <span className={`px-2.5 py-1 rounded-full font-label-md text-label-md whitespace-nowrap ${map[s] || ""}`}>{label[s] || s}</span>;
}

export default function AdminDashboard({
  settings,
  donations,
  expenses,
  summary,
}: {
  settings: Settings;
  donations: Donation[];
  expenses: Expense[];
  summary: Summary;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(settings);
  const [exp, setExp] = useState({ description: "", amount: "" });

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(""), 2500);
  };

  async function post(url: string, body: unknown): Promise<boolean> {
    setBusy(true);
    try {
      const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) {
        flash(j.error || "Gagal menyimpan");
        return false;
      }
      return true;
    } catch {
      flash("Kesalahan jaringan");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (await post("/api/admin/settings", form)) {
      flash("Pengaturan tersimpan ✓");
      router.refresh();
    }
  }
  async function donationAction(id: number, action: string) {
    if (action === "delete" && !confirm("Hapus donasi ini?")) return;
    if (await post("/api/admin/donation", { id, action })) router.refresh();
  }
  async function addExpense(e: React.FormEvent) {
    e.preventDefault();
    if (await post("/api/admin/expense", { action: "add", description: exp.description, amount: exp.amount })) {
      setExp({ description: "", amount: "" });
      flash("Pengeluaran ditambah ✓");
      router.refresh();
    }
  }
  async function delExpense(id: number) {
    if (!confirm("Hapus pengeluaran ini?")) return;
    if (await post("/api/admin/expense", { action: "delete", id })) router.refresh();
  }
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-headline-md text-headline-md text-primary">Admin Panel</h1>
          <p className="font-label-md text-label-md text-secondary">HUT RI ke-81 Villa Gardenia</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/api/admin/export" className={btnGhost}>
            <span className="material-symbols-outlined text-base" aria-hidden>download</span> Unduh Excel
          </a>
          <a href="/" target="_blank" className={btnGhost}>
            <span className="material-symbols-outlined text-base" aria-hidden>open_in_new</span> Lihat Situs
          </a>
          <button onClick={logout} className={btnGhost}>
            <span className="material-symbols-outlined text-base" aria-hidden>logout</span> Keluar
          </button>
        </div>
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: "Terkumpul", v: rupiah(summary.totalPemasukan), c: "text-primary" },
          { l: "Pengeluaran", v: rupiah(summary.totalPengeluaran), c: "text-on-surface" },
          { l: "Saldo", v: rupiah(summary.saldo), c: "text-primary" },
          { l: "Menunggu Verifikasi", v: String(summary.pending), c: summary.pending ? "text-[#7a5f00]" : "text-on-surface" },
        ].map((s) => (
          <div key={s.l} className={`${card} p-4`}>
            <div className="font-label-md text-label-md text-secondary mb-1">{s.l}</div>
            <div className={`font-headline-sm text-headline-sm tabular-nums ${s.c}`}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Pengaturan */}
      <section className={`${card} p-6`}>
        <h2 className="font-headline-sm text-headline-sm text-on-surface mb-4">Pengaturan Pembayaran</h2>
        <form onSubmit={saveSettings} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(
            [
              ["bank", "Bank", "mis. BCA"],
              ["noRekening", "No. Rekening", "1234567890"],
              ["atasNama", "Atas Nama", "Nama pemilik rekening"],
              ["whatsapp", "WhatsApp Bendahara", "08xxx atau 62xxx"],
              ["qrisImage", "URL Gambar QRIS (opsional)", "https://..."],
            ] as const
          ).map(([key, label, ph]) => (
            <label key={key} className="block">
              <span className="font-label-md text-label-md text-secondary block mb-1">{label}</span>
              <input className={input} value={form[key]} placeholder={ph} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            </label>
          ))}
          <label className="block">
            <span className="font-label-md text-label-md text-secondary block mb-1">Target Dana (Rp)</span>
            <input className={`${input} tabular-nums`} inputMode="numeric" value={String(form.target)} onChange={(e) => setForm({ ...form, target: Number(e.target.value.replace(/\D/g, "")) || 0 })} />
          </label>

          <div className="md:col-span-2 border-t border-outline-variant pt-4 mt-1">
            <h3 className="font-label-md text-label-md text-on-surface font-bold mb-1">Bot Telegram — pembagian peran</h3>
            <p className="font-label-md text-label-md text-secondary mb-3">
              Dapatkan chat id dengan mengirim <code className="bg-surface-container-high px-1 rounded">/id</code> ke bot. Pisahkan dengan koma bila lebih dari satu.
            </p>
          </div>
          <label className="block">
            <span className="font-label-md text-label-md text-secondary block mb-1">Chat ID Bendahara (verifikasi & perintah)</span>
            <input className={`${input} tabular-nums`} placeholder="mis. 12345678, 87654321" value={form.bendaharaChatIds} onChange={(e) => setForm({ ...form, bendaharaChatIds: e.target.value })} />
          </label>
          <label className="block">
            <span className="font-label-md text-label-md text-secondary block mb-1">Chat ID Arsip Backup (hanya terima backup)</span>
            <input className={`${input} tabular-nums`} placeholder="mis. -100123456789 (grup arsip)" value={form.backupChatIds} onChange={(e) => setForm({ ...form, backupChatIds: e.target.value })} />
          </label>

          <div className="md:col-span-2">
            <button type="submit" disabled={busy} className={btnPrimary}>
              <span className="material-symbols-outlined text-base" aria-hidden>save</span> Simpan Pengaturan
            </button>
          </div>
        </form>
      </section>

      {/* Donasi */}
      <section className={`${card} overflow-hidden`}>
        <div className="p-6 border-b border-outline-variant">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Donasi ({donations.length})</h2>
          <p className="font-label-md text-label-md text-secondary">Terima/Tolak donasi yang menunggu. Yang diterima langsung tampil di situs.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-md">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-4 py-3 font-label-md text-label-md text-on-surface-variant">Tanggal</th>
                <th className="px-4 py-3 font-label-md text-label-md text-on-surface-variant">Nama</th>
                <th className="px-4 py-3 font-label-md text-label-md text-on-surface-variant text-right">Nominal</th>
                <th className="px-4 py-3 font-label-md text-label-md text-on-surface-variant">Status</th>
                <th className="px-4 py-3 font-label-md text-label-md text-on-surface-variant">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {donations.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-secondary">Belum ada donasi.</td></tr>
              ) : (
                donations.map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-3 text-secondary whitespace-nowrap">{waktuID(d.createdAt)}</td>
                    <td className="px-4 py-3 text-on-surface">{d.name || <span className="text-secondary italic">(tanpa nama)</span>}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-primary whitespace-nowrap">{rupiah(d.amount)}</td>
                    <td className="px-4 py-3"><StatusBadge s={d.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {d.status === "pending" && (
                          <>
                            <button onClick={() => donationAction(d.id, "approve")} disabled={busy} className="px-3 py-1.5 rounded-full bg-primary text-on-primary font-label-md text-label-md press">Terima</button>
                            <button onClick={() => donationAction(d.id, "reject")} disabled={busy} className="px-3 py-1.5 rounded-full border border-outline-variant text-on-surface font-label-md text-label-md press">Tolak</button>
                          </>
                        )}
                        <button onClick={() => donationAction(d.id, "delete")} disabled={busy} aria-label="Hapus" className="px-2 py-1.5 rounded-full text-secondary hover:text-error press">
                          <span className="material-symbols-outlined text-base" aria-hidden>delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pengeluaran */}
      <section className={`${card} overflow-hidden`}>
        <div className="p-6 border-b border-outline-variant">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Pengeluaran ({expenses.length})</h2>
        </div>
        <form onSubmit={addExpense} className="p-4 flex flex-col sm:flex-row gap-2 border-b border-outline-variant">
          <input className={input} placeholder="Keterangan (mis. Sewa Tenda)" value={exp.description} onChange={(e) => setExp({ ...exp, description: e.target.value })} />
          <input className={`${input} sm:max-w-[180px] tabular-nums`} inputMode="numeric" placeholder="Jumlah (Rp)" value={exp.amount} onChange={(e) => setExp({ ...exp, amount: e.target.value })} />
          <button type="submit" disabled={busy} className={`${btnPrimary} whitespace-nowrap`}>
            <span className="material-symbols-outlined text-base" aria-hidden>add</span> Tambah
          </button>
        </form>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-md">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-4 py-3 font-label-md text-label-md text-on-surface-variant">Tanggal</th>
                <th className="px-4 py-3 font-label-md text-label-md text-on-surface-variant">Keterangan</th>
                <th className="px-4 py-3 font-label-md text-label-md text-on-surface-variant text-right">Jumlah</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {expenses.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-secondary">Belum ada pengeluaran.</td></tr>
              ) : (
                expenses.map((e) => (
                  <tr key={e.id}>
                    <td className="px-4 py-3 text-secondary whitespace-nowrap">{tglID(e.date)}</td>
                    <td className="px-4 py-3 text-on-surface">{e.description}</td>
                    <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">{rupiah(e.amount)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => delExpense(e.id)} disabled={busy} aria-label="Hapus" className="text-secondary hover:text-error press">
                        <span className="material-symbols-outlined text-base" aria-hidden>delete</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {msg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] bg-inverse-surface text-inverse-on-surface px-5 py-3 rounded-full font-label-md text-label-md shadow-xl" role="status" aria-live="polite">
          {msg}
        </div>
      )}
    </div>
  );
}
