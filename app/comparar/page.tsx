import { auth } from "@/lib/auth";
import { listAnalysesForUser } from "@/lib/analysis-repository";
import { CompareAnalyses } from "@/components/compare/compare-analyses";

export default async function CompararPage() {
  // A rota já é protegida pelo proxy (ver proxy.ts); a sessão aqui só
  // popula os dados iniciais do usuário autenticado.
  const session = await auth();
  const userId = session!.user!.id!;

  const analyses = await listAnalysesForUser(userId);

  return (
    <div className="flex flex-1 flex-col gap-6 bg-zinc-50 px-4 py-10 dark:bg-black sm:px-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Comparar versões</h1>
        <p className="text-sm text-muted-foreground">
          Veja a evolução da sua compatibilidade entre duas análises já feitas.
        </p>
      </div>

      <CompareAnalyses analyses={analyses} />
    </div>
  );
}
