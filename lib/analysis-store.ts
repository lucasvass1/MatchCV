import { prisma } from "@/lib/prisma";
import type { AnalysisResult } from "@/lib/gemini";

// Guarda resultados de análises anônimas por um curto período, permitindo que
// o usuário reivindique o resultado completo assim que fizer login, sem
// precisar refazer a chamada à IA nem expor os campos protegidos antes disso.
//
// Persistido em banco (tabela PendingAnalysis) — e não em memória — para
// funcionar em ambientes com múltiplas instâncias/serverless, onde o POST e o
// GET do claim podem cair em processos diferentes. Uso único e curto (30min).
const TTL_MS = 30 * 60 * 1000; // 30 minutos

export type ClaimedAnalysis = {
  result: AnalysisResult;
  resumeText: string;
  jobDescriptionText: string;
};

export async function saveAnalysis(
  result: AnalysisResult,
  resumeText: string,
  jobDescriptionText: string
): Promise<string> {
  // Limpeza best-effort das análises pendentes já expiradas.
  await prisma.pendingAnalysis
    .deleteMany({ where: { createdAt: { lt: new Date(Date.now() - TTL_MS) } } })
    .catch(() => {});

  const pending = await prisma.pendingAnalysis.create({
    data: { result, resumeText, jobDescriptionText },
  });
  return pending.id;
}

export async function claimAnalysis(id: string): Promise<ClaimedAnalysis | null> {
  const pending = await prisma.pendingAnalysis.findUnique({ where: { id } });
  if (!pending) return null;

  // Uso único: remove ao reivindicar (mesmo que já esteja expirada).
  await prisma.pendingAnalysis.delete({ where: { id } }).catch(() => {});

  if (Date.now() - pending.createdAt.getTime() > TTL_MS) return null;

  return {
    result: pending.result as AnalysisResult,
    resumeText: pending.resumeText,
    jobDescriptionText: pending.jobDescriptionText,
  };
}
