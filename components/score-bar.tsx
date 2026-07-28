"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Faixas de compatibilidade → cor, alinhadas ao tom das recomendações
// (verde = forte, âmbar = parcial, vermelho = baixa). Centraliza a regra
// para que barra e número usem sempre a mesma cor.
export function scoreTone(score: number): "high" | "mid" | "low" {
  if (score >= 75) return "high";
  if (score >= 50) return "mid";
  return "low";
}

const BAR_CLASS: Record<ReturnType<typeof scoreTone>, string> = {
  high: "bg-emerald-500",
  mid: "bg-amber-500",
  low: "bg-red-500",
};

const TEXT_CLASS: Record<ReturnType<typeof scoreTone>, string> = {
  high: "text-emerald-600 dark:text-emerald-400",
  mid: "text-amber-600 dark:text-amber-500",
  low: "text-red-600 dark:text-red-400",
};

export function scoreTextClass(score: number) {
  return TEXT_CLASS[scoreTone(score)];
}

export function ScoreBar({ score, className }: { score: number; className?: string }) {
  const clamped = Math.max(0, Math.min(100, score));
  // A barra preenche de 0% até o valor real quando aparece. Sob redução de
  // movimento, mostra o valor final direto (sem transição).
  const [width, setWidth] = useState(0);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Atualiza o estado dentro do rAF: sob redução de movimento, desliga a
    // transição e preenche no mesmo commit (troca instantânea).
    const id = requestAnimationFrame(() => {
      if (reduced) setAnimate(false);
      setWidth(clamped);
    });
    return () => cancelAnimationFrame(id);
  }, [clamped]);

  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Compatibilidade"
    >
      <div
        className={cn("h-full rounded-full", BAR_CLASS[scoreTone(clamped)])}
        style={{
          width: `${width}%`,
          transition: animate ? "width 720ms cubic-bezier(0.22, 1, 0.36, 1)" : "none",
        }}
      />
    </div>
  );
}
