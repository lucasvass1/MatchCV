"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { LogOut, Menu, X } from "lucide-react";

const NAV_ITEMS = [
  { href: "/analisar", label: "Nova análise" },
  { href: "/vagas", label: "Minhas vagas" },
  { href: "/comparar", label: "Comparar versões" },
  { href: "/curriculos", label: "Meus currículos" },
  { href: "/progresso", label: "Meu progresso" },
];

export function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAuthenticated = Boolean(session?.user);
  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold tracking-tight"
        >
          <Image src="/logo.png" alt="" width={28} height={28} priority />
          MatchCV
        </Link>

        {status === "loading" ? (
          <ThemeToggle />
        ) : isAuthenticated ? (
          <>
            <nav className="hidden items-center gap-1 lg:flex">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.href} href={item.href} active={pathname === item.href}>
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="hidden items-center gap-3 lg:flex">
              <span className="max-w-[16ch] truncate text-sm text-muted-foreground">
                {session!.user!.name ?? session!.user!.email}
              </span>
              <ThemeToggle />
              <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
                <LogOut className="size-4" />
                Sair
              </Button>
            </div>

            <div className="flex items-center gap-2 lg:hidden">
              <ThemeToggle />
              <button
                type="button"
                className="flex size-9 items-center justify-center rounded-lg border border-border text-foreground"
                aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen((v) => !v)}
              >
                {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/login" />}>
              Entrar
            </Button>
            <Button size="sm" nativeButton={false} render={<Link href="/register" />}>
              Criar conta
            </Button>
          </div>
        )}
      </div>

      {isAuthenticated && mobileOpen && (
        <div className="flex flex-col gap-1 border-t bg-background px-4 py-3 lg:hidden">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMobile}
              aria-current={pathname === item.href ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-2 flex items-center justify-between border-t pt-3">
            <span className="max-w-[18ch] truncate text-sm text-muted-foreground">
              {session!.user!.name ?? session!.user!.email}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                closeMobile();
                signOut({ callbackUrl: "/" });
              }}
            >
              <LogOut className="size-4" />
              Sair
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </Link>
  );
}
