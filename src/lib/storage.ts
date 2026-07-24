import path from "node:path";
import fs from "node:fs/promises";

// Lokasi file SQLite dari DATABASE_URL (file:./... atau file:/app/...)
export function dbFilePath(): string {
  const raw = (process.env.DATABASE_URL || "file:./prisma/data/dev.db").replace(/^file:/, "");
  return path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw);
}

// Folder bukti transfer — satu volume dengan database agar ikut persisten.
export function uploadsDir(): string {
  return path.join(path.dirname(dbFilePath()), "uploads");
}

export async function saveUpload(filename: string, data: Uint8Array): Promise<string> {
  const dir = uploadsDir();
  await fs.mkdir(dir, { recursive: true });
  const full = path.join(dir, filename);
  await fs.writeFile(full, data);
  return full;
}
