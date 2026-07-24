import { getPublicData } from "@/lib/data";
import { getSettings } from "@/lib/settings";
import { KONFIG } from "@/lib/config";
import { paragraphs, parseKegiatan, parsePanitia, parseRekening, parseKontak } from "@/lib/content";
import { inisial } from "@/lib/format";
import Countdown from "@/components/Countdown";
import LiveData from "@/components/LiveData";
import SiteHeader from "@/components/SiteHeader";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Home() {
  const d = await getPublicData();
  const s = await getSettings();
  const hari = Math.max(0, Math.floor((new Date(KONFIG.acara.tanggalHariH).getTime() - Date.now()) / 86400000));

  const tentang = paragraphs(s.tentang);
  const kegiatan = parseKegiatan(s.kegiatan);
  const panitia = parsePanitia(s.panitia);
  const kontak = parseKontak(s.kontak);
  const adaSponsor = !!(s.sponsorText.trim() || s.sponsorWa || s.sponsorUrl);

  const pembayaran = {
    rekening: [
      { bank: s.bank, norek: s.noRekening, nama: s.atasNama },
      ...parseRekening(s.rekeningLain),
    ],
    whatsapp: s.whatsapp,
    qrisImage: s.qrisImage,
    kodeUnik: s.kodeUnik,
  };

  return (
    <>
      <SiteHeader />

      <main className="w-full">
        {/* HERO — ilustrasi perayaan sebagai panggung, dipecah jadi lapisan animasi */}
        <section className="relative w-full scroll-mt-24" id="beranda">
          {/* Lapisan 1: ilustrasi (Ken Burns pelan) */}
          <div className="relative w-full overflow-hidden h-[420px] sm:h-[480px] md:h-[560px] lg:h-[640px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/hero-illustration.jpg"
              alt="Ilustrasi perayaan HUT RI ke-81 warga Villa Gardenia"
              className="hero-kenburns w-full h-full object-cover object-[50%_30%]"
            />

            {/* Lapisan 2: kelip di atas kembang api ilustrasi */}
            <div aria-hidden>
              {[
                { left: "26%", top: "13%", delay: "0s" },
                { left: "13%", top: "7%", delay: "0.9s" },
                { left: "72%", top: "9%", delay: "0.4s" },
                { left: "80%", top: "24%", delay: "1.4s" },
                { left: "66%", top: "19%", delay: "2s" },
              ].map((t, i) => (
                <span key={i} className="twinkle" style={{ left: t.left, top: t.top, animationDelay: t.delay }} />
              ))}
            </div>

            {/* Lapisan 3: konfeti pelan terus melayang */}
            <div aria-hidden>
              {[
                { left: "6%", delay: "0s", dur: "11s", c: "#d3170a" },
                { left: "16%", delay: "3s", dur: "13s", c: "#ffffff" },
                { left: "27%", delay: "6s", dur: "10s", c: "#ffe16d" },
                { left: "38%", delay: "1.5s", dur: "12s", c: "#ffffff" },
                { left: "52%", delay: "4.5s", dur: "14s", c: "#d3170a" },
                { left: "63%", delay: "8s", dur: "11s", c: "#ffe16d" },
                { left: "74%", delay: "2.5s", dur: "13s", c: "#d3170a" },
                { left: "85%", delay: "5.5s", dur: "10s", c: "#ffffff" },
                { left: "93%", delay: "7s", dur: "12s", c: "#d3170a" },
              ].map((p, i) => (
                <span
                  key={i}
                  className="hero-confetti"
                  style={{ left: p.left, background: p.c, animationDelay: p.delay, animationDuration: p.dur }}
                />
              ))}
            </div>

            {/* Peralihan halus ke konten di bawah */}
            <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-b from-transparent to-surface" aria-hidden />
          </div>

          {/* Lapisan 4: kartu konten — countdown & info menyatu rapi */}
          <div className="relative z-20 -mt-24 md:-mt-32 px-margin-mobile md:px-margin-desktop">
            <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-b from-[#c00e00] to-[#8f0100] text-white shadow-2xl border border-white/15 px-6 py-8 md:px-12 md:py-10 flex flex-col items-center text-center">
              <span className="inline-flex items-center gap-2 mb-stack-md px-4 py-1.5 rounded-full bg-white/15 text-white font-label-md text-label-md backdrop-blur-sm">
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden>flag</span>
                HUT RI ke-81 · 17 Agustus 2026
              </span>
              <h1 className="font-headline-xl-mobile text-headline-xl-mobile md:font-headline-lg md:text-headline-lg mb-stack-md max-w-3xl">
                Rayakan Kemerdekaan di <span className="text-[#ffe16d]">Villa Gardenia!</span>
              </h1>
              <p className="font-body-lg text-body-lg text-white/90 max-w-2xl mb-stack-lg">
                Mari bergotong royong menyukseskan perayaan HUT RI ke-81. Setiap donasi Anda membawa kita lebih dekat ke acara yang meriah dan tak terlupakan.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3 mb-stack-lg">
                <a className="inline-flex items-center justify-center bg-white text-primary font-bold font-label-md text-label-md px-8 py-4 rounded-full press glow-red-hover text-lg" href="#donasi">
                  Donasi Sekarang
                  <span className="material-symbols-outlined ml-2 text-base" aria-hidden>arrow_forward</span>
                </a>
                <a className="inline-flex items-center justify-center bg-transparent text-white border border-white/60 font-label-md text-label-md px-8 py-4 rounded-full hover:bg-white/10 press text-lg" href="#laporan">
                  Lihat Transparansi Dana
                </a>
              </div>
              <Countdown target={KONFIG.acara.tanggalHariH} onDark />
            </div>
          </div>
        </section>

        {/* TENTANG */}
        {tentang.length > 0 && (
          <section className="py-20 px-margin-mobile md:px-margin-desktop bg-surface w-full scroll-mt-24" id="tentang">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/logo-paguyuban.png" alt="Paguyuban Warga Villa Gardenia" className="h-12 md:h-14 w-auto mx-auto mb-6" />
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-label-md text-label-md mb-4">
                  <span className="material-symbols-outlined text-base" aria-hidden>auto_stories</span> Tentang Perayaan
                </span>
                <h2 className="font-headline-xl-mobile text-headline-xl-mobile md:font-headline-xl md:text-headline-xl text-on-surface">Semangat Kemerdekaan</h2>
              </div>
              <div className="space-y-5">
                {tentang.map((p, i) => (
                  <p key={i} className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed text-justify">{p}</p>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* PROGRESS + KEGIATAN + DONASI + DONATUR + LAPORAN (live) */}
        <LiveData initial={d} hari={hari} pembayaran={pembayaran} kegiatan={kegiatan} />

        {/* PANITIA */}
        {panitia.length > 0 && (
          <section className="py-24 px-margin-mobile md:px-margin-desktop bg-surface w-full scroll-mt-24" id="panitia">
            <div className="max-w-container-max mx-auto">
              <div className="text-center mb-12">
                <h2 className="font-headline-xl-mobile text-headline-xl-mobile md:font-headline-xl md:text-headline-xl text-on-surface mb-4">Panitia</h2>
                <p className="font-body-lg text-body-lg text-secondary max-w-2xl mx-auto">Pemuda-pemudi & warga Villa Gardenia yang menjadi motor penggerak perayaan ini.</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {panitia.map((p, i) => (
                  <div key={i} className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 text-center">
                    <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-headline-sm text-headline-sm mb-3">{inisial(p.nama)}</div>
                    <div className="font-body-md text-body-md text-on-surface font-semibold">{p.nama}</div>
                    {p.jabatan && <div className="font-label-md text-label-md text-secondary mt-1">{p.jabatan}</div>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* SPONSORSHIP */}
        {adaSponsor && (
          <section className="py-24 px-margin-mobile md:px-margin-desktop bg-surface-container-low w-full scroll-mt-24" id="sponsor">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-headline-xl-mobile text-headline-xl-mobile md:font-headline-xl md:text-headline-xl text-on-surface mb-4">Sponsorship</h2>
              {paragraphs(s.sponsorText).map((p, i) => (
                <p key={i} className="font-body-lg text-body-lg text-secondary mb-4">{p}</p>
              ))}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
                {s.sponsorUrl && (
                  <a href={s.sponsorUrl} target="_blank" rel="noopener" className="inline-flex items-center gap-2 bg-primary text-on-primary font-label-md text-label-md px-6 py-3 rounded-full press glow-red">
                    <span className="material-symbols-outlined text-base" aria-hidden>description</span> Unduh Proposal Mitra
                  </a>
                )}
                {s.sponsorWa && (
                  <a href={`https://wa.me/${s.sponsorWa}`} target="_blank" rel="noopener" className="inline-flex items-center gap-2 bg-surface-container-lowest text-on-surface border border-outline-variant font-label-md text-label-md px-6 py-3 rounded-full press hover:border-primary hover:text-primary">
                    <span className="material-symbols-outlined text-base" aria-hidden>chat</span> Hubungi Koordinator Sponsorship
                  </a>
                )}
              </div>
            </div>
          </section>
        )}

        {/* KONTAK */}
        {kontak.length > 0 && (
          <section className="py-24 px-margin-mobile md:px-margin-desktop bg-surface w-full scroll-mt-24" id="kontak-panitia">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-headline-xl-mobile text-headline-xl-mobile md:font-headline-xl md:text-headline-xl text-on-surface mb-4">Hubungi Kami</h2>
              <p className="font-body-lg text-body-lg text-secondary mb-8">Ingin ikut serta dalam perayaan atau memiliki pertanyaan? Silakan hubungi panitia:</p>
              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3">
                {kontak.map((k, i) => (
                  <a key={i} href={`https://wa.me/${k.wa}`} target="_blank" rel="noopener" className="inline-flex items-center gap-2 bg-surface-container-lowest text-on-surface border border-outline-variant font-label-md text-label-md px-6 py-3 rounded-full press hover:border-primary hover:text-primary">
                    <span className="material-symbols-outlined text-base text-primary" aria-hidden>chat</span> Hubungi {k.nama}
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="bg-surface-container-highest border-t border-outline-variant" id="kontak">
        <div className="flag-stripe" aria-hidden />
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-stack-lg max-w-container-max mx-auto gap-stack-md">
          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logo-paguyuban.png" alt="Paguyuban Warga Villa Gardenia" className="h-9 w-auto" />
            <div className="font-body-md text-body-md text-secondary">© 2026 Panitia HUT RI ke-81 Villa Gardenia. Semangat Gotong Royong.</div>
            <a className="font-body-md text-body-md text-primary hover:underline" href={`https://wa.me/${s.whatsapp}`}>Kontak Panitia (WhatsApp)</a>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo-hut81.jpg" alt="Logo HUT RI ke-81" className="h-20 w-auto rounded-xl" />
        </div>
      </footer>
    </>
  );
}
