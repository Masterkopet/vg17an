"use client";

import { useEffect, useState } from "react";

const links = [
  { href: "#tentang", label: "Tentang" },
  { href: "#kegiatan", label: "Kegiatan" },
  { href: "#donasi", label: "Donasi" },
  { href: "#donatur", label: "Donatur" },
  { href: "#laporan", label: "Laporan" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const close = () => setOpen(false);

  return (
    <header
      className={`bg-surface/90 backdrop-blur border-b border-outline-variant w-full top-0 z-50 sticky transition-shadow duration-300 ${scrolled ? "shadow-md" : "shadow-none"}`}
    >
      <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop h-20 max-w-container-max mx-auto">
        <a href="#beranda" onClick={close} className="flex items-center gap-2 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo-paguyuban.png" alt="Paguyuban Warga Villa Gardenia" className="h-9 md:h-10 w-auto" />
        </a>

        <nav className="hidden md:flex items-center gap-gutter">
          {links.map((l) => (
            <a key={l.href} className="text-secondary font-medium font-label-md text-label-md hover:text-primary transition-colors" href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>

        <a className="hidden md:flex items-center justify-center bg-primary text-on-primary font-label-md text-label-md px-6 py-3 rounded-full hover:bg-surface-tint press glow-red" href="#donasi">
          Donasi Sekarang
        </a>

        <button
          type="button"
          className="md:hidden text-on-surface press -mr-2 p-2"
          aria-label={open ? "Tutup menu" : "Buka menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="material-symbols-outlined" aria-hidden>{open ? "close" : "menu"}</span>
        </button>
      </div>

      <div
        id="mobile-menu"
        className={`md:hidden overflow-hidden transition-all duration-200 ease-out motion-reduce:transition-none ${
          open ? "max-h-96 opacity-100 border-t border-outline-variant" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="flex flex-col px-margin-mobile py-2 bg-surface">
          {links.map((l) => (
            <a key={l.href} onClick={close} className="py-3 text-on-surface font-label-md text-label-md hover:text-primary transition-colors" href={l.href}>
              {l.label}
            </a>
          ))}
          <a onClick={close} className="mt-2 mb-3 text-center bg-primary text-on-primary font-label-md text-label-md px-6 py-3 rounded-full press" href="#donasi">
            Donasi Sekarang
          </a>
        </nav>
      </div>
      <div className="flag-stripe" aria-hidden />
    </header>
  );
}
