import { getPublicData } from "@/lib/data";
import { KONFIG } from "@/lib/config";
import Countdown from "@/components/Countdown";
import LiveData from "@/components/LiveData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HERO_BG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCQMEdNk95Z24tVlydrXB2MoaP9Z1qgMg2FtQmMND0YgbR4TivnVHPCmSJnlCU1nTLO235pyIzpo7fF2v3fFEZzqsX_CK6v8XH-yQxNH8SAYpUq74ijKm5raTPi2uSfiQhNpzpAe184kbGQivxnuGaPK4frJW3eEhbfx4Jw0o-VGBr06HurqTUOT4F2ZelJu2Af9XmhL3c2Q6SHGAycGkvcu_aPBuDGKBJx7dJB2I2fOvEHu5SDhGJarX-FndhmbP7dRgCsTnIn8bg";

export default async function Home() {
  const d = await getPublicData();
  const hari = Math.max(0, Math.floor((new Date(KONFIG.acara.tanggalHariH).getTime() - Date.now()) / 86400000));

  return (
    <>
      <header className="bg-surface/90 backdrop-blur border-b border-outline-variant w-full top-0 z-50 sticky">
        <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop h-20 max-w-container-max mx-auto">
          <a href="#tentang" className="font-headline-md text-headline-md font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden>celebration</span>
            Villa Gardenia 17-an
          </a>
          <nav className="hidden md:flex items-center gap-gutter">
            <a className="text-secondary font-medium font-label-md text-label-md hover:text-primary transition-colors" href="#kegiatan">Kegiatan</a>
            <a className="text-secondary font-medium font-label-md text-label-md hover:text-primary transition-colors" href="#donasi">Donasi</a>
            <a className="text-secondary font-medium font-label-md text-label-md hover:text-primary transition-colors" href="#donatur">Donatur</a>
            <a className="text-secondary font-medium font-label-md text-label-md hover:text-primary transition-colors" href="#laporan">Laporan</a>
          </nav>
          <a className="flex items-center justify-center bg-primary text-on-primary font-label-md text-label-md px-6 py-3 rounded-full hover:bg-surface-tint press glow-red" href="#donasi">Donasi</a>
        </div>
      </header>

      <main className="w-full">
        {/* HERO */}
        <section className="relative w-full pt-16 pb-20 md:pt-28 md:pb-32 px-margin-mobile md:px-margin-desktop overflow-hidden scroll-mt-24" id="tentang">
          <div className="absolute inset-0 w-full h-full z-0">
            <div className="w-full h-full bg-cover bg-center opacity-20" style={{ backgroundImage: `url('${HERO_BG}')` }} />
            <div className="absolute inset-0 bg-gradient-to-b from-surface via-surface/80 to-surface" />
          </div>
          <div className="relative z-10 max-w-container-max mx-auto flex flex-col items-center text-center">
            <span className="inline-flex items-center gap-2 mb-stack-md px-4 py-1.5 rounded-full bg-primary/10 text-primary font-label-md text-label-md">
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden>flag</span>
              HUT RI ke-81 · 17 Agustus 2026
            </span>
            <h1 className="font-headline-xl-mobile text-headline-xl-mobile md:font-headline-xl md:text-headline-xl text-on-surface mb-stack-md max-w-4xl">
              Rayakan Kemerdekaan di <span className="text-primary">Villa Gardenia!</span>
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mb-stack-lg">
              Mari bergotong royong menyukseskan perayaan HUT RI ke-81. Setiap donasi Anda membawa kita lebih dekat ke acara yang meriah dan tak terlupakan.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-stack-lg">
              <a className="inline-flex items-center justify-center bg-primary text-on-primary font-label-md text-label-md px-8 py-4 rounded-full hover:bg-surface-tint press glow-red-hover text-lg" href="#donasi">
                Donasi Sekarang
                <span className="material-symbols-outlined ml-2 text-base" aria-hidden>arrow_forward</span>
              </a>
              <a className="inline-flex items-center justify-center bg-surface-container-lowest text-on-surface border border-outline-variant font-label-md text-label-md px-8 py-4 rounded-full hover:border-primary hover:text-primary press text-lg" href="#laporan">
                Lihat Transparansi Dana
              </a>
            </div>
            <Countdown target={KONFIG.acara.tanggalHariH} />
          </div>
        </section>

        {/* PROGRESS + KEGIATAN + DONASI + DONATUR + LAPORAN (live, auto-refresh) */}
        <LiveData initial={d} hari={hari} />
      </main>

      <footer className="bg-surface-container-highest border-t border-outline-variant" id="kontak">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-stack-lg max-w-container-max mx-auto gap-stack-md">
          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-2">
            <div className="font-headline-sm text-headline-sm font-bold text-on-surface">Villa Gardenia 17-an</div>
            <div className="font-body-md text-body-md text-secondary">© 2026 Panitia HUT RI ke-81 Villa Gardenia. Semangat Gotong Royong.</div>
            <a className="font-body-md text-body-md text-primary hover:underline" href={`https://wa.me/${KONFIG.pembayaran.whatsapp}`}>Kontak Panitia (WhatsApp)</a>
          </div>
        </div>
      </footer>
    </>
  );
}
