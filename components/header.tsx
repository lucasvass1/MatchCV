"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="flex items-center justify-between border-b px-4 py-3 sm:px-8">
      <Link href="/" className="text-lg font-bold tracking-tight">
        MatchCV
      </Link>

      <div className="flex items-center gap-3">
        {status === "loading" ? null : session?.user ? (
          <>
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {session.user.name ?? session.user.email}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="size-4" />
              Sair
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="sm" render={<Link href="/login" />}>
              Entrar
            </Button>
            <Button size="sm" render={<Link href="/register" />}>
              Criar conta
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
