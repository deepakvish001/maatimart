import { useEffect, useState } from "react";

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return { d, h, m, s };
}

export function Countdown({ target, className = "" }: { target: number; className?: string }) {
  const [t, setT] = useState(() => diff(target));
  useEffect(() => {
    const i = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(i);
  }, [target]);
  const Cell = ({ v, l }: { v: number; l: string }) => (
    <div className="grid place-items-center rounded-lg bg-background border border-border w-12 h-14 shadow-sm">
      <span className="font-display text-xl font-bold leading-none text-foreground tabular-nums">
        {String(v).padStart(2, "0")}
      </span>
      <span className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">{l}</span>
    </div>
  );
  return (
    <div className={`flex gap-1.5 ${className}`}>
      <Cell v={t.d} l="Days" />
      <Cell v={t.h} l="Hrs" />
      <Cell v={t.m} l="Min" />
      <Cell v={t.s} l="Sec" />
    </div>
  );
}
