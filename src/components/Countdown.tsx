"use client";

import { useEffect, useState } from "react";

function diffParts(targetMs: number) {
  const diff = Math.max(0, targetMs - Date.now());
  const s = Math.floor(diff / 1000);
  return {
    hari: Math.floor(s / 86400),
    jam: Math.floor((s % 86400) / 3600),
    menit: Math.floor((s % 3600) / 60),
    detik: s % 60,
    habis: diff <= 0,
  };
}

const box = "bg-surface-container-lowest border border-outline-variant rounded-xl py-3 glow-red";
const num = "font-headline-md text-headline-md text-primary tabular-nums";
const lbl = "font-label-md text-label-md text-secondary";
const pad = (n: number) => String(n).padStart(2, "0");

export default function Countdown({ target, onDark = false }: { target: string; onDark?: boolean }) {
  const targetMs = new Date(target).getTime();
  // null saat SSR/hidrasi pertama agar HTML server & client identik ("--"),
  // angka asli diisi setelah mount — menghindari hydration mismatch.
  const [t, setT] = useState<ReturnType<typeof diffParts> | null>(null);

  useEffect(() => {
    setT(diffParts(targetMs));
    const id = setInterval(() => setT(diffParts(targetMs)), 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  return (
    <div className="w-full max-w-md">
      <p className={`font-label-md text-label-md mb-2 ${onDark ? "text-white/85" : "text-secondary"}`}>
        {t?.habis ? "Dirgahayu Republik Indonesia! 🇮🇩" : "Menuju Hari-H"}
      </p>
      <div className="grid grid-cols-4 gap-2 md:gap-3">
        <div className={box}>
          <div className={num}>{t ? t.hari : "--"}</div>
          <div className={lbl}>Hari</div>
        </div>
        <div className={box}>
          <div className={num}>{t ? pad(t.jam) : "--"}</div>
          <div className={lbl}>Jam</div>
        </div>
        <div className={box}>
          <div className={num}>{t ? pad(t.menit) : "--"}</div>
          <div className={lbl}>Menit</div>
        </div>
        <div className={box}>
          <div className={num}>{t ? pad(t.detik) : "--"}</div>
          <div className={lbl}>Detik</div>
        </div>
      </div>
    </div>
  );
}
