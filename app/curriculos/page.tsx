import { auth } from "@/lib/auth";
import { listAdaptedResumesForUser } from "@/lib/analysis-repository";
import { ResumeLibrary } from "@/components/resume-library/resume-library";

export default async function CurriculosPage() {
  // A rota já é protegida pelo proxy (ver proxy.ts); a sessão aqui só
  // popula os dados iniciais do usuário autenticado.
  const session = await auth();
  const userId = session!.user!.id!;

  const resumes = await listAdaptedResumesForUser(userId);

  return (
    <div className="flex flex-1 flex-col items-center gap-6 bg-zinc-50 px-4 py-10 dark:bg-black sm:px-8">
      <div className="flex w-full max-w-3xl flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Meus currículos</h1>
        <p className="text-sm text-muted-foreground">
          Todas as versões de currículo adaptadas que você já gerou, prontas para
          baixar ou reutilizar em uma nova análise.
        </p>
      </div>

      <ResumeLibrary resumes={resumes} />
    </div>
  );
}
