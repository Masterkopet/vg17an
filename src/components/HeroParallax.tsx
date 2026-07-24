"use client";

import { useEffect, useRef } from "react";

/*
 * Panggung hero berlapis (parallax):
 *  - depth: seberapa jauh lapisan bergeser mengikuti mouse (px maks)
 *  - scroll: faktor pergeseran saat halaman di-scroll
 * Ilustrasi = lapisan terjauh (gerak paling pelan); balon & pita = lapisan
 * terpisah yang dibuat ulang (CSS/SVG) sehingga bisa melayang bebas.
 */

const TWINKLES = [
  { left: "26%", top: "13%", delay: "0s" },
  { left: "13%", top: "7%", delay: "0.9s" },
  { left: "72%", top: "9%", delay: "0.4s" },
  { left: "80%", top: "24%", delay: "1.4s" },
  { left: "66%", top: "19%", delay: "2s" },
];

const CONFETTI = [
  { left: "6%", delay: "0s", dur: "11s", c: "#d3170a" },
  { left: "16%", delay: "3s", dur: "13s", c: "#ffffff" },
  { left: "27%", delay: "6s", dur: "10s", c: "#ffe16d" },
  { left: "38%", delay: "1.5s", dur: "12s", c: "#ffffff" },
  { left: "52%", delay: "4.5s", dur: "14s", c: "#d3170a" },
  { left: "63%", delay: "8s", dur: "11s", c: "#ffe16d" },
  { left: "74%", delay: "2.5s", dur: "13s", c: "#d3170a" },
  { left: "85%", delay: "5.5s", dur: "10s", c: "#ffffff" },
  { left: "93%", delay: "7s", dur: "12s", c: "#d3170a" },
];

function Ribbon({ flip = false, className = "" }: { flip?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 120 420"
      className={className}
      style={flip ? { transform: "scaleX(-1)" } : undefined}
      aria-hidden
    >
      <path
        d="M60 0 C 15 70, 105 150, 45 230 C 10 285, 95 350, 55 420"
        fill="none"
        stroke="#d3170a"
        strokeWidth="16"
        strokeLinecap="round"
      />
      <path
        d="M60 0 C 15 70, 105 150, 45 230 C 10 285, 95 350, 55 420"
        fill="none"
        stroke="#ffffff"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray="26 34"
        opacity="0.9"
      />
    </svg>
  );
}

function Balloon({ white = false, className = "" }: { white?: boolean; className?: string }) {
  return (
    <div className={`balloon-wrap ${className}`} aria-hidden>
      <div className={`balloon ${white ? "balloon-white" : ""}`} />
      <div className="balloon-string" />
    </div>
  );
}

export default function HeroParallax() {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const layers = Array.from(stage.querySelectorAll<HTMLElement>("[data-depth]"));
    let raf = 0;
    let tx = 0, ty = 0, cx = 0, cy = 0; // target & current mouse (-0.5..0.5)
    let ts = 0, cs = 0;                 // target & current scroll

    const onMove = (e: MouseEvent) => {
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
    };
    const onLeave = () => { tx = 0; ty = 0; };
    const onScroll = () => { ts = Math.min(window.scrollY, 1200); };

    const tick = () => {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      cs += (ts - cs) * 0.12;
      for (const el of layers) {
        const depth = parseFloat(el.dataset.depth || "0");
        const scrollF = parseFloat(el.dataset.scroll || "0");
        el.style.transform = `translate3d(${(cx * depth).toFixed(2)}px, ${(cy * depth + cs * scrollF).toFixed(2)}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseout", onLeave, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div
      ref={stageRef}
      className="relative w-full overflow-hidden h-[420px] sm:h-[480px] md:h-auto md:aspect-[1717/916] md:max-h-[900px]"
    >
      {/* L1 — ilustrasi (terjauh, gerak paling pelan) */}
      <div data-depth="8" data-scroll="0.18" className="absolute -inset-4 will-change-transform">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/hero-illustration.jpg"
          alt="Ilustrasi perayaan HUT RI ke-81 warga Villa Gardenia"
          className="hero-kenburns w-full h-full object-cover object-[50%_30%]"
        />
      </div>

      {/* L2 — pita melayang (desktop saja; di layar sempit menutupi logo ilustrasi) */}
      <div data-depth="22" data-scroll="-0.1" className="absolute inset-0 pointer-events-none will-change-transform hidden md:block" aria-hidden>
        <Ribbon className="ribbon ribbon-left" />
        <Ribbon flip className="ribbon ribbon-right" />
      </div>

      {/* L3 — balon (lapisan terdekat; di mobile hanya 2 di pojok atas) */}
      <div data-depth="34" data-scroll="-0.22" className="absolute inset-0 pointer-events-none will-change-transform" aria-hidden>
        <Balloon className="balloon-a" />
        <Balloon white className="balloon-b hidden sm:flex" />
        <Balloon className="balloon-c" />
        <Balloon white className="balloon-d hidden sm:flex" />
      </div>

      {/* L4 — kelip kembang api */}
      <div aria-hidden>
        {TWINKLES.map((t, i) => (
          <span key={i} className="twinkle" style={{ left: t.left, top: t.top, animationDelay: t.delay }} />
        ))}
      </div>

      {/* L5 — konfeti */}
      <div aria-hidden>
        {CONFETTI.map((p, i) => (
          <span
            key={i}
            className="hero-confetti"
            style={{ left: p.left, background: p.c, animationDelay: p.delay, animationDuration: p.dur }}
          />
        ))}
      </div>

      {/* Peralihan halus ke konten */}
      <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-b from-transparent to-surface z-10" aria-hidden />
    </div>
  );
}
