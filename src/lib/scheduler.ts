import { prisma } from "./db";
import { adminChatIds, telegramConfigured } from "./telegram";
import { sendBackup } from "./backup";
import { wibHour, wibDate } from "./format";

let started = false;

// Backup Excel OTOMATIS ke Telegram bendahara, sekali sehari pada jam BACKUP_HOUR (WIB, default 21).
export function startBackupScheduler(): void {
  if (started) return;
  started = true;

  const CHECK_MS = 30 * 60 * 1000; // periksa tiap 30 menit
  const run = async () => {
    try {
      if (!telegramConfigured()) return;
      const ids = adminChatIds();
      if (ids.length === 0) return;

      const targetHour = Number(process.env.BACKUP_HOUR ?? 21) || 21;
      if (wibHour() < targetHour) return;

      const today = wibDate();
      const last = await prisma.setting.findUnique({ where: { key: "lastBackupDate" } });
      if (last?.value === today) return; // sudah backup hari ini

      const n = await sendBackup(ids, `📎 Backup otomatis laporan keuangan — ${today}`);
      if (n > 0) {
        await prisma.setting.upsert({
          where: { key: "lastBackupDate" },
          create: { key: "lastBackupDate", value: today },
          update: { value: today },
        });
        console.log(`[backup] terkirim ke ${n} admin (${today})`);
      }
    } catch (e) {
      console.error("[backup] scheduler error:", e);
    }
  };

  setInterval(run, CHECK_MS);
  setTimeout(run, 60 * 1000); // cek juga ~1 menit setelah server hidup
  console.log("[backup] scheduler aktif (jam target WIB:", process.env.BACKUP_HOUR ?? 21, ")");
}
