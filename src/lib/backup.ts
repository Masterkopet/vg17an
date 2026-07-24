import path from "node:path";
import fs from "node:fs/promises";
import { prisma } from "./db";
import { buildLaporanWorkbook } from "./excel";
import { tgSendDocument } from "./telegram";
import { wibDate } from "./format";
import { dbFilePath } from "./storage";

// Snapshot database yang konsisten (VACUUM INTO); fallback: salin file mentah.
async function buildDbSnapshot(): Promise<Uint8Array<ArrayBuffer> | null> {
  const src = dbFilePath();
  const tmp = path.join(path.dirname(src), `backup-tmp-${Date.now()}.db`);
  try {
    try {
      await prisma.$executeRawUnsafe(`VACUUM INTO '${tmp.replace(/\\/g, "/").replace(/'/g, "''")}'`);
    } catch {
      await fs.copyFile(src, tmp);
    }
    const buf = await fs.readFile(tmp);
    return new Uint8Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)) as Uint8Array<ArrayBuffer>;
  } catch (e) {
    console.error("[backup] gagal membuat snapshot DB:", e);
    return null;
  } finally {
    await fs.unlink(tmp).catch(() => {});
  }
}

export async function sendBackup(
  chatIds: (string | number)[],
  caption: string,
  opts: { includeDb?: boolean } = {}
): Promise<number> {
  if (chatIds.length === 0) return 0;
  const tanggal = wibDate();
  const excel = await buildLaporanWorkbook();
  const db = opts.includeDb ? await buildDbSnapshot() : null;

  let sent = 0;
  for (const id of chatIds) {
    const r = await tgSendDocument(
      id,
      `laporan-vg17an-${tanggal}.xlsx`,
      excel,
      caption,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    if (r && r.ok) sent++;
    if (db) {
      await tgSendDocument(id, `database-vg17an-${tanggal}.db`, db, "🗄 Salinan database (untuk pemulihan). Simpan baik-baik.");
    }
  }
  return sent;
}
