"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.ok) {
        router.replace("/admin");
        router.refresh();
      } else {
        setErr(j.error || "Gagal masuk");
      }
    } catch {
      setErr("Kesalahan jaringan");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface-container-low px-margin-mobile">
      <form onSubmit={submit} className="w-full max-w-sm bg-surface-container-lowest border border-outline-variant rounded-3xl p-8 glow-red">
        <div className="text-center mb-6">
          <span className="material-symbols-outlined text-primary text-4xl mb-2" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden>lock</span>
          <h1 className="font-headline-sm text-headline-sm text-on-surface">Admin Panel</h1>
          <p className="font-label-md text-label-md text-secondary">HUT RI ke-81 Villa Gardenia</p>
        </div>
        <label className="block mb-2 font-label-md text-label-md text-secondary" htmlFor="pw">Password admin</label>
        <input
          id="pw"
          type="password"
          autoFocus
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          className="w-full rounded-xl border-0 py-3 px-4 text-on-surface ring-1 ring-inset ring-outline-variant focus:ring-2 focus:ring-inset focus:ring-primary font-body-md text-body-md bg-surface-container-lowest"
          placeholder="••••••••"
        />
        {err && <p className="mt-3 font-label-md text-label-md text-error">{err}</p>}
        <button type="submit" disabled={busy} className="mt-5 w-full flex items-center justify-center gap-2 bg-primary text-on-primary font-label-md text-label-md px-6 py-3 rounded-full press disabled:opacity-50">
          {busy ? "Memeriksa…" : "Masuk"}
        </button>
        <a href="/" className="block text-center mt-4 font-label-md text-label-md text-secondary hover:text-primary">← Kembali ke situs</a>
      </form>
    </main>
  );
}
