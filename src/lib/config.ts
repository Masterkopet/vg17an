// Konfigurasi PUBLIK (boleh terlihat umum — memang tampil di situs).
// Rahasia (token bot, dsb) TIDAK di sini — pakai Environment Variables.
export const KONFIG = {
  acara: {
    nama: "HUT RI ke-81",
    lokasi: "Villa Gardenia",
    tanggalHariH: "2026-08-17T07:00:00+07:00",
  },
  danaTarget: 25_000_000,
  pembayaran: {
    bank: "BCA", // GANTI
    noRekening: "0000 1111 2222", // GANTI
    atasNama: "Bendahara Panitia (contoh)", // GANTI
    whatsapp: "6281234567890", // GANTI (format 62...)
    qrisImage: "", // opsional: URL gambar QRIS
  },
  nominalCepat: [50_000, 100_000, 200_000, 500_000],
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://17an.villagardenia.online",
};

export type Konfig = typeof KONFIG;
