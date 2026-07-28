import { auth } from "@/lib/auth";
import { listAnalysesForStats } from "@/lib/analysis-repository";
import { buildAnalysisStats } from "@/lib/analysis-stats";
import { ProgressDashboard } from "@/components/progress/progress-dashboard";

export default async function ProgressoPage() {
  // A rota já é protegida pelo proxy (ver proxy.ts); a sessão aqui só
  // popula os dados iniciais do usuário autenticado.
  const session = await auth();
  const userId = session!.user!.id!;

  const analyses = await listAnalysesForStats(userId);
  const stats = buildAnalysisStats(analyses);

  return (
    <div className="flex flex-1 flex-col items-center gap-6 bg-zinc-50 px-4 py-10 dark:bg-black sm:px-8">
      <div className="flex w-full max-w-4xl flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Meu progresso</h1>
        <p className="text-sm text-muted-foreground">
          Sua evolução de compatibilidade e as tecnologias mais relevantes nas
          vagas que você analisou.
        </p>
      </div>

      <ProgressDashboard stats={stats} />
    </div>
  );
}
