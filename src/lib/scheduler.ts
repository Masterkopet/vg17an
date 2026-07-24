import { prisma } from "./db";
import { telegramConfigured } from "./telegram";
import { getBackupChatIds, getBendaharaChatIds } from "./settings";
import { sendBackup } from "./backup";
import { wibHour, wibDate } from "./format";

let started = false;

// Backup otomatis harian (Excel + salinan database) pada jam BACKUP_HOUR WIB (default 21).
// Dikirim ke chat ARSIP (backupChatIds) agar tidak mengganggu bendahara;
// bila arsip belum diisi, fallback ke bendahara (keselamatan data lebih utama).
export function startBackupScheduler(): void {
  if (started) return;
  started = true;

  const CHECK_MS = 30 * 60 * 1000;
  const run = async () => {
    try {
      if (!telegramConfigured()) return;

      const targetHour = Number(process.env.BACKUP_HOUR ?? 21) || 21;
      if (wibHour() < targetHour) return;

      const today = wibDate();
      const last = await prisma.setting.findUnique({ where: { key: "lastBackupDate" } });
      if (last?.value === today) return;

      let ids = await getBackupChatIds();
      let viaFallback = false;
      if (ids.length === 0) {
        ids = await getBendaharaChatIds();
        viaFallback = true;
      }
      if (ids.length === 0) return;

      const caption =
        `📎 Backup otomatis — ${today}` +
        (viaFallback ? "\n(💡 Atur 'Chat ID Arsip Backup' di Admin Panel agar backup tidak masuk ke chat bendahara.)" : "");
      const n = await sendBackup(ids, caption, { includeDb: true });
      if (n > 0) {
        await prisma.setting.upsert({
          where: { key: "lastBackupDate" },
          create: { key: "lastBackupDate", value: today },
          update: { value: today },
        });
        console.log(`[backup] terkirim ke ${n} tujuan (${today})`);
      }
    } catch (e) {
      console.error("[backup] scheduler error:", e);
    }
  };

  setInterval(run, CHECK_MS);
  setTimeout(run, 60 * 1000);
  console.log("[backup] scheduler aktif (jam target WIB:", process.env.BACKUP_HOUR ?? 21, ")");
}
