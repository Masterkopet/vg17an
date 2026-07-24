"use client";

import { useEffect, useRef, useState } from "react";
import { KONFIG } from "@/lib/config";
import { rupiah } from "@/lib/format";
import { compressImage } from "@/lib/compressImage";

const presets = KONFIG.nominalCepat;

export type Pembayaran = { bank: string; noRekening: string; atasNama: string; whatsapp: string; qrisImage: string };

export default function DonationForm({ pembayaran: p }: { pembayaran: Pembayaran }) {
  const [nominal, setNominal] = useState(0);
  const [nama, setNama] = useState("");
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [proof, setProof] = useState<File | null>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [proofSent, setProofSent] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!proof) {
      setProofUrl(null);
      return;
    }
    const url = URL.createObjectURL(proof);
    setProofUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [proof]);

  async function pilihBukti(e: React.ChangeEvent<HTMLInputElement>) {
    const inputEl = e.target;
    const f = inputEl.files?.[0] || null;
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setMsg("Bukti harus berupa foto/gambar");
      setTimeout(() => setMsg(""), 3000);
      inputEl.value = "";
      return;
    }
    setCompressing(true);
    try {
      // Foto besar dikompres otomatis di HP donatur — tanpa ribet.
      const hasil = await compressImage(f);
      if (!["image/jpeg", "image/png", "image/webp"].includes(hasil.type)) {
        setMsg("Format foto tidak didukung — pakai JPG/PNG");
        setTimeout(() => setMsg(""), 3000);
        return;
      }
      if (hasil.size > 5 * 1024 * 1024) {
        setMsg("Foto terlalu besar. Coba foto/screenshot lain");
        setTimeout(() => setMsg(""), 3000);
        return;
      }
      setProof(hasil);
    } finally {
      setCompressing(false);
      inputEl.value = "";
    }
  }

  function pilih(v: number) {
    setNominal(v);
  }
  function onInput(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "");
    setNominal(digits ? Number(digits) : 0);
  }
  const tampil = nominal ? nominal.toLocaleString("id-ID") : "";

  function lanjut(e: React.FormEvent) {
    e.preventDefault();
    if (nominal < 1000) {
      setMsg("Masukkan nominal donasi dulu ya 🙏");
      setTimeout(() => setMsg(""), 2500);
      return;
    }
    setStatus("idle");
    setOpen(true);
  }

  async function sudahTransfer() {
    setStatus("sending");
    try {
      const fd = new FormData();
      fd.append("name", nama.trim());
      fd.append("amount", String(nominal));
      if (proof) fd.append("proof", proof);
      const res = await fetch("/api/donate", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Gagal");
      setProofSent(!!data.proofReceived);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setMsg(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  }

  function tutup() {
    setOpen(false);
    if (status === "done") {
      setNominal(0);
      setNama("");
      setProof(null);
      setProofSent(false);
      setStatus("idle");
    }
  }

  const waText = encodeURIComponent(
    `Halo Panitia HUT RI ke-81 Villa Gardenia 🇮🇩\n\nSaya sudah transfer donasi:\n• Nama: ${nama.trim() || "(mohon diisi)"}\n• Nominal: ${rupiah(nominal)}\n\nBukti transfer saya lampirkan. Terima kasih!`
  );

  return (
    <div className="bg-surface-container-lowest rounded-3xl p-8 md:p-12 border border-outline-variant glow-red">
      <div className="text-center mb-10">
        <span className="material-symbols-outlined text-primary text-5xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden>
          volunteer_activism
        </span>
        <h2 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-on-surface mb-2">Dukung Acara Kita</h2>
        <p className="font-body-md text-body-md text-secondary">Pilih nominal donasi Anda untuk memeriahkan acara 17-an tahun ini.</p>
      </div>

      <form className="space-y-8" onSubmit={lanjut} noValidate>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {presets.map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={nominal === v}
              onClick={() => pilih(v)}
              className="quick-nominal press py-3 px-4 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface font-label-md text-label-md hover:border-primary hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {rupiah(v)}
            </button>
          ))}
        </div>

        <div>
          <label className="block font-label-md text-label-md text-on-surface mb-2" htmlFor="amount">
            Atau masukkan nominal
          </label>
          <div className="relative rounded-xl">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <span className="text-secondary font-body-lg text-body-lg">Rp</span>
            </div>
            <input
              id="amount"
              inputMode="numeric"
              autoComplete="off"
              value={tampil}
              onChange={onInput}
              placeholder="0"
              className="block w-full rounded-xl border-0 py-4 pl-12 pr-4 text-on-surface ring-1 ring-inset ring-outline-variant focus:ring-2 focus:ring-inset focus:ring-primary font-body-lg text-body-lg bg-surface-container-lowest tabular-nums"
            />
          </div>
          <label className="block mt-2 font-label-md text-label-md text-secondary" htmlFor="donor-name">
            Nama (opsional, untuk papan donatur)
          </label>
          <input
            id="donor-name"
            autoComplete="name"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Nama / Blok — mis. Kel. Wijaya (Blok C)"
            className="mt-1 block w-full rounded-xl border-0 py-3 px-4 text-on-surface ring-1 ring-inset ring-outline-variant focus:ring-2 focus:ring-inset focus:ring-primary font-body-md text-body-md bg-surface-container-lowest"
          />
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary font-label-md text-label-md px-8 py-4 rounded-full hover:bg-surface-tint press glow-red-hover text-lg"
        >
          <span className="material-symbols-outlined" aria-hidden>payments</span> Lanjut Bayar
        </button>
        {msg && !open && <p className="text-center font-label-md text-label-md text-error">{msg}</p>}
        <p className="text-center font-label-md text-label-md text-secondary flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-base" aria-hidden>lock</span> Donasi via transfer bank / QRIS.
        </p>
      </form>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={tutup} />
          <div className="relative w-full max-w-md bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            <button onClick={tutup} aria-label="Tutup" className="absolute top-4 right-4 text-secondary hover:text-on-surface press">
              <span className="material-symbols-outlined" aria-hidden>close</span>
            </button>

            {status === "done" ? (
              <div className="text-center py-6">
                <span className="material-symbols-outlined text-primary text-5xl mb-3" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden>check_circle</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">Terima kasih! 🇮🇩</h3>
                <p className="font-body-md text-body-md text-secondary">
                  Donasi Anda <b>{rupiah(nominal)}</b> tercatat{proofSent ? " dan bukti transfer sudah diteruskan ke bendahara" : ""}. Sedang <b>menunggu verifikasi</b> — setelah dicek, otomatis muncul di papan donatur & laporan.
                </p>
                <button onClick={tutup} className="mt-6 bg-primary text-on-primary font-label-md text-label-md px-8 py-3 rounded-full press">Tutup</button>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <span className="material-symbols-outlined text-primary text-4xl mb-2" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden>account_balance_wallet</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">Selesaikan Donasi</h3>
                  <p className="font-body-md text-body-md text-secondary mt-1">Nominal donasi Anda</p>
                  <p className="font-headline-md text-headline-md text-primary mt-1 tabular-nums">{rupiah(nominal)}</p>
                </div>

                <div className="rounded-2xl border border-outline-variant p-4 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-primary" aria-hidden>account_balance</span>
                    <span className="font-label-md text-label-md text-on-surface">Transfer Bank</span>
                  </div>
                  <div className="space-y-2 font-body-md text-body-md">
                    <div className="flex justify-between"><span className="text-secondary">Bank</span><span className="text-on-surface font-semibold">{p.bank}</span></div>
                    <div className="flex justify-between items-center">
                      <span className="text-secondary">No. Rekening</span>
                      <span className="flex items-center gap-2">
                        <span className="text-on-surface font-semibold tabular-nums">{p.noRekening}</span>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(p.noRekening.replace(/[\s.-]/g, ""));
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            } catch {
                              /* clipboard tidak tersedia */
                            }
                          }}
                          aria-label="Salin nomor rekening"
                          className={`press inline-flex items-center gap-1 px-2 py-1 rounded-lg font-label-md text-label-md transition-colors ${copied ? "bg-[#e6f4ea] text-[#1e6b33]" : "text-primary hover:bg-primary/5"}`}
                        >
                          <span className="material-symbols-outlined text-base" aria-hidden>{copied ? "check" : "content_copy"}</span>
                          {copied ? "Tersalin" : "Salin"}
                        </button>
                      </span>
                    </div>
                    <div className="flex justify-between"><span className="text-secondary">Atas Nama</span><span className="text-on-surface font-semibold text-right">{p.atasNama}</span></div>
                  </div>
                </div>

                {p.qrisImage && (
                  <div className="rounded-2xl border border-outline-variant p-4 mb-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-primary" aria-hidden>qr_code_2</span>
                      <span className="font-label-md text-label-md text-on-surface">Scan QRIS</span>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.qrisImage} alt="Kode QRIS" className="mx-auto max-w-[220px] w-full rounded-xl border border-outline-variant" />
                  </div>
                )}

                {/* Upload bukti transfer — langsung diteruskan ke Telegram bendahara */}
                <div className="rounded-2xl border border-outline-variant p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-primary" aria-hidden>photo_camera</span>
                    <span className="font-label-md text-label-md text-on-surface">Bukti Transfer (opsional)</span>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={pilihBukti} />
                  {proofUrl ? (
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={proofUrl} alt="Pratinjau bukti transfer" className="w-16 h-16 object-cover rounded-xl border border-outline-variant" />
                      <div className="min-w-0 flex-1">
                        <p className="font-label-md text-label-md text-on-surface truncate">{proof?.name}</p>
                        <p id="proof-size" className="font-label-md text-label-md text-secondary">{proof ? Math.max(1, Math.round(proof.size / 1024)) + " KB — " : ""}akan diteruskan ke bendahara.</p>
                      </div>
                      <button type="button" onClick={() => { setProof(null); if (fileRef.current) fileRef.current.value = ""; }} aria-label="Hapus bukti" className="text-secondary hover:text-error press">
                        <span className="material-symbols-outlined" aria-hidden>delete</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={compressing}
                      className="w-full flex items-center justify-center gap-2 border border-dashed border-outline-variant rounded-xl py-3 text-secondary hover:text-primary hover:border-primary press font-label-md text-label-md disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined" aria-hidden>{compressing ? "hourglass_top" : "add_photo_alternate"}</span>
                      {compressing ? "Memproses foto…" : "Lampirkan foto bukti transfer"}
                    </button>
                  )}
                  <p className="mt-2 font-label-md text-label-md text-secondary">Tidak wajib — foto besar otomatis diperkecil.</p>
                </div>

                <p className="font-body-md text-body-md text-secondary text-center mb-4">
                  Transfer sesuai nominal, lampirkan bukti, lalu tekan tombol di bawah. Bendahara memverifikasi & donasi otomatis tampil di situs.
                </p>

                {status === "error" && <p className="text-center font-label-md text-label-md text-error mb-3">{msg}</p>}
                {msg && status !== "error" && <p className="text-center font-label-md text-label-md text-error mb-3">{msg}</p>}

                <button
                  onClick={sudahTransfer}
                  disabled={status === "sending"}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary font-label-md text-label-md px-8 py-4 rounded-full hover:bg-surface-tint press glow-red-hover text-lg disabled:opacity-50"
                >
                  <span className="material-symbols-outlined" aria-hidden>{status === "sending" ? "hourglass_top" : "check"}</span>
                  {status === "sending" ? "Mengirim…" : "Saya Sudah Transfer"}
                </button>
                <a
                  href={`https://wa.me/${p.whatsapp}?text=${waText}`}
                  target="_blank"
                  rel="noopener"
                  className="mt-3 w-full flex items-center justify-center gap-2 text-secondary font-label-md text-label-md px-8 py-2 rounded-full press hover:text-primary"
                >
                  <span className="material-symbols-outlined text-base" aria-hidden>chat</span> Atau konfirmasi via WhatsApp
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
