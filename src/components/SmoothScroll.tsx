"use client";

import { useEffect } from "react";

// Membuat SEMUA tautan anchor (#...) di halaman scroll dengan halus.
// Next.js App Router menangani klik hash secara instan, jadi kita ambil alih.
export default function SmoothScroll() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a) return;
      const href = a.getAttribute("href") || "";
      if (!href.startsWith("#") || href === "#") return;

      let target: Element | null = null;
      try {
        target = document.getElementById(decodeURIComponent(href.slice(1)));
      } catch {
        return;
      }
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" }); // menghormati scroll-margin-top
      history.pushState(null, "", href);

      // Aksesibilitas: pindahkan fokus ke seksi tujuan tanpa mengganggu animasi scroll.
      const el = target as HTMLElement;
      if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
      el.focus({ preventScroll: true });
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
