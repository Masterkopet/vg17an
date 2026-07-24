export function rupiah(n: number): string {
  const v = Number.isFinite(n) ? n : 0;
  try {
    return "Rp " + Math.round(v).toLocaleString("id-ID");
  } catch {
    return "Rp " + String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
}

// Parser angka tahan-banting (locale Indonesia): "Rp 3.500.000", "3.500.000", "3500000" -> 3500000
export function parseAmount(raw: unknown): number {
  if (raw == null) return 0;
  let s = String(raw).trim();
  if (!s) return 0;
  s = s.replace(/[^\d.,-]/g, "");
  const lc = s.lastIndexOf(",");
  const ld = s.lastIndexOf(".");
  let dec: string | null = null;
  if (lc > -1 && ld > -1) dec = lc > ld ? "," : ".";
  else if (lc > -1) dec = /,\d{1,2}$/.test(s) && !/^\d{1,3}(,\d{3})+$/.test(s) ? "," : null;
  else if (ld > -1) dec = /\.\d{1,2}$/.test(s) && !/^\d{1,3}(\.\d{3})+$/.test(s) ? "." : null;
  if (dec) {
    const thou = dec === "," ? "." : ",";
    s = s.split(thou).join("").replace(dec, ".");
  } else {
    s = s.replace(/[.,]/g, "");
  }
  const n = parseFloat(s);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
}

export function tglID(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function waktuID(d: Date | string | null | undefined): string {
  if (!d) return "";
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt.getTime())) return "";
  return dt.toLocaleString("id-ID", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" });
}

export function inisial(name: string | null | undefined): string {
  const parts = String(name || "")
    .replace(/\(.*?\)/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  return parts.map((w) => Array.from(w)[0]).join("").toUpperCase() || "?";
}
