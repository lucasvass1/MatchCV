import { auth } from "@/lib/auth";
import { listJobApplicationsForUser } from "@/lib/job-application-repository";
import { listAnalysesForUser } from "@/lib/analysis-repository";
import { JobApplicationsBoard } from "@/components/job-applications/board";
import type { JobApplicationDTO } from "@/components/job-applications/types";
import { isApplicationStatus } from "@/lib/job-application";

export default async function VagasPage() {
  // A rota já é protegida pelo proxy (ver proxy.ts); a sessão aqui só
  // popula os dados iniciais do usuário autenticado.
  const session = await auth();
  const userId = session!.user!.id!;

  const [jobApplications, analyses] = await Promise.all([
    listJobApplicationsForUser(userId),
    listAnalysesForUser(userId),
  ]);

  // status é armazenado como String no schema (mesmo padrão de
  // recommendationVerdict, ver Analysis) — só o próprio repositório escreve
  // nele, então os valores aqui são sempre um ApplicationStatus válido.
  const jobApplicationsDTO: JobApplicationDTO[] = jobApplications.map((app) => ({
    ...app,
    status: isApplicationStatus(app.status) ? app.status : "applied",
  }));

  return (
    <div className="flex flex-1 flex-col gap-6 bg-zinc-50 px-4 py-10 dark:bg-black sm:px-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Minhas candidaturas</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe o andamento de cada vaga que você aplicou.
        </p>
      </div>

      <JobApplicationsBoard
        initialJobApplications={jobApplicationsDTO}
        analyses={analyses}
      />
    </div>
  );
}
