"use client";

import { useEffect, useRef, useState } from "react";

// Conta de 0 até o valor real (ex: score de compatibilidade), sincronizado
// com o preenchimento da barra. Puramente visual: não atrasa nenhuma ação.
// Respeita prefers-reduced-motion mostrando o valor final imediatamente.
export function AnimatedNumber({
  value,
  suffix = "",
  durationMs = 700,
  className,
}: {
  value: number;
  suffix?: string;
  durationMs?: number;
  className?: string;
}) {
  // Começa em 0 — estes números só aparecem no cliente (após a análise),
  // então não há valor renderizado no servidor para conflitar.
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (now: number) => {
      if (reduced) {
        setDisplay(value);
        return;
      }
      const t = Math.min(1, (now - start) / durationMs);
      setDisplay(Math.round(value * easeOutCubic(t)));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, durationMs]);

  return (
    <span className={className}>
      {display}
      {suffix}
    </span>
  );
}
