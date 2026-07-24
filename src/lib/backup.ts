import { buildLaporanWorkbook } from "./excel";
import { tgSendDocument } from "./telegram";
import { wibDate } from "./format";

export async function sendBackup(chatIds: (string | number)[], caption: string): Promise<number> {
  if (chatIds.length === 0) return 0;
  const buf = await buildLaporanWorkbook();
  const name = `laporan-vg17an-${wibDate()}.xlsx`;
  let sent = 0;
  for (const id of chatIds) {
    const r = await tgSendDocument(id, name, buf, caption);
    if (r && r.ok) sent++;
  }
  return sent;
}
