"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicData } from "@/lib/data";
import { KONFIG } from "@/lib/config";
import { rupiah, tglID, waktuID, inisial } from "@/lib/format";
import Reveal from "./Reveal";
import DonationForm, { type Pembayaran } from "./DonationForm";

function useCountUp(target: number, active: boolean, duration = 1200): number {
  const [val, setVal] = useState(active ? target : 0);
  const fromRef = useRef(active ? target : 0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = fromRef.current;
    if (reduce || from === target) {
      fromRef.current = target;
      setVal(target);
      return;
    }
    let start: number | null = null;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const step = (ts: number) => {
      if (start === null) start = ts;
      const p = Math.min(1, (ts - start) / duration);
      const v = from + (target - from) * ease(p);
      fromRef.current = v;
      setVal(v);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
      else {
        fromRef.current = target;
        setVal(target);
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, active, duration]);

  return val;
}

export type KegiatanItem = { tanggal: string; judul: string; deskripsi: string };

const PAGE_SIZE = 10;

function Pager({ cur, max, onPage }: { cur: number; max: number; onPage: (p: number) => void }) {
  if (max <= 1) return null;
  const btn =
    "inline-flex items-center gap-1 px-4 py-2 rounded-full border border-outline-variant font-label-md text-label-md text-on-surface press hover:border-primary hover:text-primary disabled:opacity-40 disabled:pointer-events-none";
  return (
    <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-outline-variant">
      <button type="button" className={btn} disabled={cur <= 1} onClick={() => onPage(cur - 1)} aria-label="Halaman sebelumnya">
        <span className="material-symbols-outlined text-base" aria-hidden>chevron_left</span> Sebelumnya
      </button>
      <span className="font-label-md text-label-md text-secondary tabular-nums" aria-live="polite">
        Halaman {cur} / {max}
      </span>
      <button type="button" className={btn} disabled={cur >= max} onClick={() => onPage(cur + 1)} aria-label="Halaman berikutnya">
        Berikutnya <span className="material-symbols-outlined text-base" aria-hidden>chevron_right</span>
      </button>
    </div>
  );
}

export default function LiveData({
  initial,
  hari,
  pembayaran,
  kegiatan,
}: {
  initial: PublicData;
  hari: number;
  pembayaran: Pembayaran;
  kegiatan: KegiatanItem[];
}) {
  const [data, setData] = useState<PublicData>(initial);
  const [revealed, setRevealed] = useState(false);
  const [toast, setToast] = useState("");
  const [dPage, setDPage] = useState(1);
  const [tPage, setTPage] = useState(1);
  const progressRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Polling: perbarui data tanpa reload
  useEffect(() => {
    let alive = true;
    async function poll() {
      try {
        const r = await fetch("/api/data", { cache: "no-store" });
        if (!r.ok) return;
        const j = (await r.json()) as PublicData;
        if (alive) setData(j);
      } catch {
        /* diamkan — coba lagi siklus berikutnya */
      }
    }
    const id = setInterval(poll, 15000);
    const onVis = () => {
      if (document.visibilityState === "visible") poll();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      alive = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // Reveal saat bagian progress masuk layar
  useEffect(() => {
    const el = progressRef.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setRevealed(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          setRevealed(true);
          io.disconnect();
        }
      }),
      { threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  }, []);

  const pctReal = data.target > 0 ? (data.totalPemasukan / data.target) * 100 : 0;
  const pctClamped = Math.max(0, Math.min(100, pctReal));
  const terkumpul = useCountUp(data.totalPemasukan, revealed);
  const persen = useCountUp(pctReal, revealed);

  const transaksi = [
    ...data.donatur.map((x) => ({ tanggal: x.tanggal, ket: x.nama, kat: "Pemasukan", jumlah: x.jumlah, masuk: true })),
    ...data.pengeluaran.map((x) => ({ tanggal: x.tanggal, ket: x.keterangan, kat: "Pengeluaran", jumlah: x.jumlah, masuk: false })),
  ].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

  const shareText = `Ayo dukung perayaan HUT RI ke-81 di Villa Gardenia! 🇮🇩 Terkumpul ${rupiah(data.totalPemasukan)} dari target ${rupiah(data.target)}. Ikut berdonasi di sini:`;

  // Paginasi client-side (10/halaman) — halaman otomatis ter-clamp saat data berubah.
  const dMax = Math.max(1, Math.ceil(data.donatur.length / PAGE_SIZE));
  const dCur = Math.min(dPage, dMax);
  const donaturRows = data.donatur.slice((dCur - 1) * PAGE_SIZE, dCur * PAGE_SIZE);

  const tMax = Math.max(1, Math.ceil(transaksi.length / PAGE_SIZE));
  const tCur = Math.min(tPage, tMax);
  const transaksiRows = transaksi.slice((tCur - 1) * PAGE_SIZE, tCur * PAGE_SIZE);

  return (
    <>
      {/* PROGRESS */}
      <section className="py-16 md:py-20 px-margin-mobile md:px-margin-desktop bg-surface-container-low w-full scroll-mt-24" id="progress">
        <div className="max-w-container-max mx-auto">
          <div ref={progressRef} className="bg-surface-container-lowest rounded-[24px] p-6 md:p-12 border border-outline-variant glow-red">
            <h2 className="font-headline-md text-headline-md text-on-surface mb-1">Progress Penggalangan Dana</h2>
            <p className="font-body-md text-body-md text-secondary mb-3">Bersama kita bisa mencapai target untuk acara yang tak terlupakan.</p>
            <div className="flex items-center flex-wrap gap-2 mb-5">
              <span className="badge-live inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-label-md text-label-md">
                <span className="material-symbols-outlined text-sm" aria-hidden>bolt</span> Data Live
              </span>
              <span className="font-label-md text-label-md text-secondary">Diperbarui {waktuID(data.updatedAt)}</span>
            </div>

            <div className="flex justify-between items-end mb-2">
              <div>
                <span className="font-label-md text-label-md text-secondary block">Terkumpul</span>
                <span className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-primary tabular-nums">{rupiah(terkumpul)}</span>
              </div>
              <div className="text-right">
                <span className="font-label-md text-label-md text-secondary block">Target</span>
                <span className="font-body-lg text-body-lg text-on-surface font-semibold tabular-nums">{rupiah(data.target)}</span>
              </div>
            </div>

            <div className="w-full h-4 bg-surface-container-highest rounded-full overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pctClamped)} aria-label="Capaian dana terkumpul">
              <div className="progress-fill h-full bg-gradient-to-r from-primary to-inverse-primary rounded-full relative shine" style={{ width: `${revealed ? pctClamped : 0}%` }} />
            </div>
            <div className="mt-2 flex justify-between font-label-md text-label-md">
              <span className="text-secondary">Ayo capai target bersama!</span>
              <span className="text-primary font-bold tabular-nums">{Math.round(persen)}% Tercapai</span>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="bg-surface-container-low rounded-xl p-3 text-center"><div className="font-headline-sm text-headline-sm text-on-surface tabular-nums">{data.jumlahDonatur.toLocaleString("id-ID")}</div><div className="font-label-md text-label-md text-secondary">Donatur</div></div>
              <div className="bg-surface-container-low rounded-xl p-3 text-center"><div className="font-headline-sm text-headline-sm text-on-surface tabular-nums">{data.sisa === 0 ? "Tercapai! 🎉" : rupiah(data.sisa)}</div><div className="font-label-md text-label-md text-secondary">Menuju Target</div></div>
              <div className="bg-surface-container-low rounded-xl p-3 text-center"><div className="font-headline-sm text-headline-sm text-on-surface tabular-nums">{hari.toLocaleString("id-ID")}</div><div className="font-label-md text-label-md text-secondary">Hari Tersisa</div></div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-6">
              <span className="font-label-md text-label-md text-secondary mr-1">Ajak tetangga:</span>
              <button id="share-wa" onClick={() => window.open("https://wa.me/?text=" + encodeURIComponent(shareText + " " + location.href), "_blank", "noopener")} className="inline-flex items-center gap-2 bg-primary/5 text-primary border border-primary/40 font-label-md text-label-md px-4 py-2 rounded-full hover:bg-primary hover:text-on-primary press transition-colors">
                <span className="material-symbols-outlined text-base" aria-hidden>share</span> WhatsApp
              </button>
              <button id="share-copy" onClick={async () => { try { await navigator.clipboard.writeText(location.href); showToast("Link tersalin!"); } catch { showToast("Gagal menyalin"); } }} className="inline-flex items-center gap-2 bg-surface-container-low text-on-surface border border-outline-variant font-label-md text-label-md px-4 py-2 rounded-full hover:border-primary press">
                <span className="material-symbols-outlined text-base" aria-hidden>link</span> Salin Link
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* KEGIATAN */}
      {kegiatan.length > 0 && (
        <section className="py-24 px-margin-mobile md:px-margin-desktop bg-surface w-full scroll-mt-24" id="kegiatan">
          <div className="max-w-container-max mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-headline-xl-mobile text-headline-xl-mobile md:font-headline-xl md:text-headline-xl text-on-surface mb-4">Rangkaian Kegiatan</h2>
              <p className="font-body-lg text-body-lg text-secondary max-w-2xl mx-auto">Berbagai acara meriah telah kami siapkan untuk merayakan kemerdekaan bersama seluruh warga Villa Gardenia.</p>
            </div>
            <div className={`grid grid-cols-1 gap-gutter ${kegiatan.length >= 3 ? "md:grid-cols-3" : kegiatan.length === 2 ? "md:grid-cols-2 max-w-3xl mx-auto" : "max-w-xl mx-auto"}`}>
              {kegiatan.map((k, i) => (
                <Reveal key={`${k.judul}-${i}`} delay={(i % 3) * 70}>
                  <article className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 h-full">
                    {k.tanggal && (
                      <div className="inline-block bg-primary/5 px-3 py-1 rounded-full border border-outline-variant mb-3"><span className="font-label-md text-label-md text-primary">{k.tanggal}</span></div>
                    )}
                    <h3 className="font-headline-md text-headline-md text-on-surface mb-2">{k.judul}</h3>
                    <p className="font-body-md text-body-md text-secondary">{k.deskripsi}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* DONASI */}
      <section className="py-24 px-margin-mobile md:px-margin-desktop bg-background w-full scroll-mt-24" id="donasi">
        <div className="max-w-3xl mx-auto">
          <DonationForm pembayaran={pembayaran} />
        </div>
      </section>

      {/* DONATUR */}
      <section className="py-24 px-margin-mobile md:px-margin-desktop bg-surface w-full scroll-mt-24" id="donatur">
        <div className="max-w-container-max mx-auto">
          <Reveal className="text-center mb-12">
            <h2 className="font-headline-xl-mobile text-headline-xl-mobile md:font-headline-xl md:text-headline-xl text-on-surface mb-4">Papan Donatur</h2>
            <p className="font-body-lg text-body-lg text-secondary max-w-2xl mx-auto">
              Terima kasih kepada <span className="text-primary font-semibold">{data.jumlahDonatur.toLocaleString("id-ID")}</span> warga dan keluarga yang telah berdonasi. Gotong royong Anda sangat berarti!
            </p>
          </Reveal>
          {data.donatur.length === 0 ? (
            <p className="text-center text-secondary font-body-md text-body-md py-8">Belum ada donasi tercatat. Jadilah yang pertama! 🇮🇩</p>
          ) : (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden max-w-3xl mx-auto">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-surface-container-low">
                      <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant whitespace-nowrap">Tanggal</th>
                      <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">Donatur</th>
                      <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant text-right">Nominal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {donaturRows.map((x) => (
                      <tr key={x.id}>
                        <td className="px-6 py-4 font-body-md text-body-md text-secondary whitespace-nowrap align-top">{tglID(x.tanggal)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="shrink-0 w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-label-md text-label-md font-bold">{inisial(x.nama)}</div>
                            <div className="min-w-0">
                              <div className="font-body-md text-body-md text-on-surface font-semibold truncate">{x.nama}</div>
                              {x.catatan && <div className="font-label-md text-label-md text-secondary truncate">“{x.catatan}”</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-body-md text-body-md text-primary text-right whitespace-nowrap tabular-nums align-top">{rupiah(x.jumlah)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pager cur={dCur} max={dMax} onPage={setDPage} />
            </div>
          )}
        </div>
      </section>

      {/* LAPORAN */}
      <section className="py-24 px-margin-mobile md:px-margin-desktop bg-surface-container-low w-full scroll-mt-24" id="laporan">
        <div className="max-w-container-max mx-auto">
          <Reveal className="text-center mb-16">
            <h2 className="font-headline-xl-mobile text-headline-xl-mobile md:font-headline-xl md:text-headline-xl text-on-surface mb-4">Laporan Keuangan Transparan</h2>
            <p className="font-body-lg text-body-lg text-secondary max-w-2xl mx-auto">Pantau penggunaan dana warga secara terbuka untuk transparansi dan akuntabilitas bersama.</p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-12">
            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant"><span className="font-label-md text-label-md text-secondary block mb-1">Total Pemasukan</span><span className="font-headline-md text-headline-md text-primary tabular-nums">{rupiah(data.totalPemasukan)}</span></div>
            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant"><span className="font-label-md text-label-md text-secondary block mb-1">Total Pengeluaran</span><span className="font-headline-md text-headline-md text-on-surface tabular-nums">{rupiah(data.totalPengeluaran)}</span></div>
            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant"><span className="font-label-md text-label-md text-secondary block mb-1">Saldo Saat Ini</span><span className="font-headline-md text-headline-md text-primary tabular-nums">{rupiah(data.saldo)}</span></div>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden">
            <div className="p-6 border-b border-outline-variant flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Riwayat Transaksi</h3>
              <button id="btn-print" onClick={() => window.print()} className="inline-flex items-center gap-2 bg-primary/5 text-primary border border-primary font-label-md text-label-md px-4 py-2 rounded-full hover:bg-primary hover:text-on-primary press transition-colors">
                <span className="material-symbols-outlined text-lg" aria-hidden>print</span> Cetak / Simpan PDF
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low">
                    <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">Tanggal</th>
                    <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">Keterangan</th>
                    <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">Kategori</th>
                    <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {transaksi.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-secondary">Belum ada transaksi.</td></tr>
                  ) : (
                    transaksiRows.map((t, i) => (
                      <tr key={(tCur - 1) * PAGE_SIZE + i}>
                        <td className="px-6 py-4 font-body-md text-body-md text-secondary whitespace-nowrap">{tglID(t.tanggal)}</td>
                        <td className="px-6 py-4 font-body-md text-body-md text-on-surface">{t.ket}</td>
                        <td className="px-6 py-4 font-body-md text-body-md text-secondary">{t.kat}</td>
                        <td className={`px-6 py-4 font-body-md text-body-md text-right whitespace-nowrap tabular-nums ${t.masuk ? "text-primary" : "text-on-surface"}`}>{t.masuk ? "+ " : "- "}{rupiah(t.jumlah)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pager cur={tCur} max={tMax} onPage={setTPage} />
          </div>
        </div>
      </section>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] bg-inverse-surface text-inverse-on-surface px-5 py-3 rounded-full font-label-md text-label-md shadow-xl" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </>
  );
}
