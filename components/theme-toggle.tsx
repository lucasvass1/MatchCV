"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "mcv-theme";

export function ThemeToggle({ className }: { className?: string }) {
  const [isDark, setIsDark] = useState(false);

  // Lê o estado real do DOM (já aplicado pelo script inline em app/layout.tsx
  // antes da hidratação) em vez de recalcular a preferência aqui, para não
  // divergir do que o usuário já está vendo.
  useEffect(() => {
    // Não dá pra ler isso durante o render: no servidor `document` não
    // existe, e usar um inicializador lazy no useState faria o primeiro
    // render do cliente já divergir do HTML do servidor (mismatch de
    // hidratação). Por isso sincroniza um tick depois, no efeito.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-muted",
        className
      )}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
