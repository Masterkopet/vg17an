import { getPublicData } from "@/lib/data";
import { KONFIG } from "@/lib/config";
import { rupiah, tglID, inisial, waktuID } from "@/lib/format";
import Countdown from "@/components/Countdown";
import DonationForm from "@/components/DonationForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HERO_BG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCQMEdNk95Z24tVlydrXB2MoaP9Z1qgMg2FtQmMND0YgbR4TivnVHPCmSJnlCU1nTLO235pyIzpo7fF2v3fFEZzqsX_CK6v8XH-yQxNH8SAYpUq74ijKm5raTPi2uSfiQhNpzpAe184kbGQivxnuGaPK4frJW3eEhbfx4Jw0o-VGBr06HurqTUOT4F2ZelJu2Af9XmhL3c2Q6SHGAycGkvcu_aPBuDGKBJx7dJB2I2fOvEHu5SDhGJarX-FndhmbP7dRgCsTnIn8bg";

export default async function Home() {
  const d = await getPublicData();
  const pct = Math.max(0, Math.min(100, Number.isFinite(d.pctReal) ? d.pctReal : 0));
  const hari = Math.max(0, Math.floor((new Date(KONFIG.acara.tanggalHariH).getTime() - Date.now()) / 86400000));

  const transaksi = [
    ...d.donatur.map((x) => ({ tanggal: x.tanggal, ket: x.nama, kat: "Pemasukan", jumlah: x.jumlah, masuk: true })),
    ...d.pengeluaran.map((x) => ({ tanggal: x.tanggal, ket: x.keterangan, kat: "Pengeluaran", jumlah: x.jumlah, masuk: false })),
  ].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

  return (
    <>
      {/* NAV */}
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

        {/* PROGRESS */}
        <section className="py-16 md:py-20 px-margin-mobile md:px-margin-desktop bg-surface-container-low w-full scroll-mt-24" id="progress">
          <div className="max-w-container-max mx-auto">
            <div className="bg-surface-container-lowest rounded-[24px] p-6 md:p-12 border border-outline-variant glow-red">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-1">Progress Penggalangan Dana</h2>
              <p className="font-body-md text-body-md text-secondary mb-1">Bersama kita bisa mencapai target untuk acara yang tak terlupakan.</p>
              <p className="font-label-md text-label-md text-secondary mb-5">Diperbarui {waktuID(d.updatedAt)}</p>

              <div className="flex justify-between items-end mb-2">
                <div>
                  <span className="font-label-md text-label-md text-secondary block">Terkumpul</span>
                  <span className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-primary tabular-nums">{rupiah(d.totalPemasukan)}</span>
                </div>
                <div className="text-right">
                  <span className="font-label-md text-label-md text-secondary block">Target</span>
                  <span className="font-body-lg text-body-lg text-on-surface font-semibold tabular-nums">{rupiah(d.target)}</span>
                </div>
              </div>

              <div className="w-full h-4 bg-surface-container-highest rounded-full overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label="Capaian dana terkumpul">
                <div className="progress-fill h-full bg-gradient-to-r from-primary to-inverse-primary rounded-full relative shine" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-2 flex justify-between font-label-md text-label-md">
                <span className="text-secondary">Ayo capai target bersama!</span>
                <span className="text-primary font-bold tabular-nums">{Math.round(pct)}% Tercapai</span>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-6">
                <div className="bg-surface-container-low rounded-xl p-3 text-center"><div className="font-headline-sm text-headline-sm text-on-surface tabular-nums">{d.jumlahDonatur.toLocaleString("id-ID")}</div><div className="font-label-md text-label-md text-secondary">Donatur</div></div>
                <div className="bg-surface-container-low rounded-xl p-3 text-center"><div className="font-headline-sm text-headline-sm text-on-surface tabular-nums">{d.sisa === 0 ? "Tercapai! 🎉" : rupiah(d.sisa)}</div><div className="font-label-md text-label-md text-secondary">Menuju Target</div></div>
                <div className="bg-surface-container-low rounded-xl p-3 text-center"><div className="font-headline-sm text-headline-sm text-on-surface tabular-nums">{hari.toLocaleString("id-ID")}</div><div className="font-label-md text-label-md text-secondary">Hari Tersisa</div></div>
              </div>
            </div>
          </div>
        </section>

        {/* KEGIATAN */}
        <section className="py-24 px-margin-mobile md:px-margin-desktop bg-surface w-full scroll-mt-24" id="kegiatan">
          <div className="max-w-container-max mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-headline-xl-mobile text-headline-xl-mobile md:font-headline-xl md:text-headline-xl text-on-surface mb-4">Rangkaian Kegiatan</h2>
              <p className="font-body-lg text-body-lg text-secondary max-w-2xl mx-auto">Berbagai acara meriah telah kami siapkan untuk merayakan kemerdekaan bersama seluruh warga Villa Gardenia.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
              {[
                { t: "Lomba Anak-anak", tgl: "17 Agustus", d: "Beragam lomba tradisional yang mendidik dan menyenangkan untuk anak-anak di lingkungan kita." },
                { t: "Malam Tirakatan", tgl: "16 Agustus", d: "Malam renungan dan doa bersama sebagai wujud syukur atas kemerdekaan bangsa." },
                { t: "Pawai Budaya", tgl: "18 Agustus", d: "Puncak acara berupa karnaval keliling perumahan menampilkan kreativitas warga." },
              ].map((k) => (
                <article key={k.t} className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant p-6">
                  <div className="inline-block bg-primary/5 px-3 py-1 rounded-full border border-outline-variant mb-3">
                    <span className="font-label-md text-label-md text-primary">{k.tgl}</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-2">{k.t}</h3>
                  <p className="font-body-md text-body-md text-secondary">{k.d}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* DONASI */}
        <section className="py-24 px-margin-mobile md:px-margin-desktop bg-background w-full scroll-mt-24" id="donasi">
          <div className="max-w-3xl mx-auto">
            <DonationForm />
          </div>
        </section>

        {/* DONATUR */}
        <section className="py-24 px-margin-mobile md:px-margin-desktop bg-surface w-full scroll-mt-24" id="donatur">
          <div className="max-w-container-max mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-headline-xl-mobile text-headline-xl-mobile md:font-headline-xl md:text-headline-xl text-on-surface mb-4">Papan Donatur</h2>
              <p className="font-body-lg text-body-lg text-secondary max-w-2xl mx-auto">
                Terima kasih kepada <span className="text-primary font-semibold">{d.jumlahDonatur.toLocaleString("id-ID")}</span> warga dan keluarga yang telah berdonasi. Gotong royong Anda sangat berarti!
              </p>
            </div>
            {d.donatur.length === 0 ? (
              <p className="text-center text-secondary font-body-md text-body-md py-8">Belum ada donasi tercatat. Jadilah yang pertama! 🇮🇩</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {d.donatur.map((x) => (
                  <div key={x.id} className="flex items-start gap-3 bg-surface-container-lowest border border-outline-variant rounded-2xl p-4">
                    <div className="shrink-0 w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-headline-sm text-headline-sm">{inisial(x.nama)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-body-md text-body-md text-on-surface font-semibold truncate">{x.nama}</span>
                        <span className="font-label-md text-label-md text-primary whitespace-nowrap tabular-nums">{rupiah(x.jumlah)}</span>
                      </div>
                      <div className="font-label-md text-label-md text-secondary">{tglID(x.tanggal)}{x.catatan ? ` · “${x.catatan}”` : ""}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* LAPORAN */}
        <section className="py-24 px-margin-mobile md:px-margin-desktop bg-surface-container-low w-full scroll-mt-24" id="laporan">
          <div className="max-w-container-max mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-headline-xl-mobile text-headline-xl-mobile md:font-headline-xl md:text-headline-xl text-on-surface mb-4">Laporan Keuangan Transparan</h2>
              <p className="font-body-lg text-body-lg text-secondary max-w-2xl mx-auto">Pantau penggunaan dana warga secara terbuka untuk transparansi dan akuntabilitas bersama.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-12">
              <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant"><span className="font-label-md text-label-md text-secondary block mb-1">Total Pemasukan</span><span className="font-headline-md text-headline-md text-primary tabular-nums">{rupiah(d.totalPemasukan)}</span></div>
              <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant"><span className="font-label-md text-label-md text-secondary block mb-1">Total Pengeluaran</span><span className="font-headline-md text-headline-md text-on-surface tabular-nums">{rupiah(d.totalPengeluaran)}</span></div>
              <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant"><span className="font-label-md text-label-md text-secondary block mb-1">Saldo Saat Ini</span><span className="font-headline-md text-headline-md text-primary tabular-nums">{rupiah(d.saldo)}</span></div>
            </div>
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden">
              <div className="p-6 border-b border-outline-variant"><h3 className="font-headline-sm text-headline-sm text-on-surface">Riwayat Transaksi</h3></div>
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
                      transaksi.map((t, i) => (
                        <tr key={i}>
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
            </div>
          </div>
        </section>
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
