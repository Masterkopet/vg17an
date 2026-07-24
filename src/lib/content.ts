// Parser konten situs dari Admin Panel (format baris sederhana dengan pemisah "|").

export function paragraphs(s: string): string[] {
  return String(s || "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function rows(s: string): string[][] {
  return String(s || "")
    .split("\n")
    .map((line) => line.split("|").map((c) => c.trim()))
    .filter((cols) => cols.some(Boolean));
}

export type Kegiatan = { tanggal: string; judul: string; deskripsi: string };
export function parseKegiatan(s: string): Kegiatan[] {
  return rows(s)
    .map(([tanggal = "", judul = "", deskripsi = ""]) => ({ tanggal, judul, deskripsi }))
    .filter((k) => k.judul);
}

export type Panitia = { nama: string; jabatan: string };
export function parsePanitia(s: string): Panitia[] {
  return rows(s)
    .map(([nama = "", jabatan = ""]) => ({ nama, jabatan }))
    .filter((p) => p.nama);
}

export type Rekening = { bank: string; norek: string; nama: string };
export function parseRekening(s: string): Rekening[] {
  return rows(s)
    .map(([bank = "", norek = "", nama = ""]) => ({ bank, norek, nama }))
    .filter((r) => r.bank && r.norek);
}

export type Kontak = { nama: string; wa: string };
export function parseKontak(s: string): Kontak[] {
  return rows(s)
    .map(([nama = "", wa = ""]) => ({ nama, wa: wa.replace(/\D/g, "") }))
    .filter((k) => k.nama && k.wa);
}
