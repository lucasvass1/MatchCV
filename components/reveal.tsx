"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// Entrada sutil (fade + leve deslocamento) quando o elemento entra na
// viewport. O estado inicial escondido usa a variante `motion-safe`, então
// quem pede redução de movimento nunca vê o conteúdo oculto — ele aparece
// normalmente. Timing/easing seguem o padrão único do MatchCV.
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={visible ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(
        "motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]",
        visible
          ? "opacity-100 translate-y-0"
          : "motion-safe:translate-y-3 motion-safe:opacity-0",
        className
      )}
    >
      {children}
    </div>
  );
}
