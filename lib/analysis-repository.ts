import { prisma } from "@/lib/prisma";
import { generateAdaptedResume, type AdaptedResume, type AnalysisResult } from "@/lib/gemini";

export async function saveAnalysisForUser(
  userId: string,
  resumeText: string,
  jobDescriptionText: string,
  result: AnalysisResult
) {
  return prisma.analysis.create({
    data: {
      userId,
      resumeText,
      jobDescriptionText,
      score: result.score,
      summary: result.summary,
      keywordsMatched: result.keywordsMatched,
      keywordsMissing: result.keywordsMissing,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      improvementTips: result.improvementTips,
      interviewTips: result.interviewTips,
      studySuggestions: result.studySuggestions,
      interviewQuestions: result.interviewQuestions,
      recommendationVerdict: result.recommendation.verdict,
      recommendationReasoning: result.recommendation.reasoning,
    },
  });
}

export async function listAnalysesForUser(userId: string) {
  return prisma.analysis.findMany({
    where: { userId },
    select: { id: true, score: true, jobDescriptionText: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
}

// Histórico de desempenho: dados brutos para lib/analysis-stats.ts calcular
// evolução de score e recorrência/aderência de palavras-chave.
export async function listAnalysesForStats(userId: string) {
  return prisma.analysis.findMany({
    where: { userId },
    select: {
      id: true,
      score: true,
      createdAt: true,
      keywordsMatched: true,
      keywordsMissing: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getOwnedAnalysis(id: string, userId: string) {
  const analysis = await prisma.analysis.findUnique({ where: { id } });
  if (!analysis || analysis.userId !== userId) return null;
  return analysis;
}

export async function saveAdaptedResume(id: string, adaptedResume: AdaptedResume) {
  return prisma.analysis.update({
    where: { id },
    data: { adaptedResume },
  });
}

type OwnedAnalysis = NonNullable<Awaited<ReturnType<typeof getOwnedAnalysis>>>;

// Gera o currículo adaptado sob demanda na primeira vez que for pedido (download
// ou biblioteca) e o salva na análise, para não chamar a IA de novo depois.
export async function getOrGenerateAdaptedResume(
  analysis: OwnedAnalysis
): Promise<AdaptedResume> {
  const existing = analysis.adaptedResume as AdaptedResume | null;
  if (existing) return existing;

  const adaptedResume = await generateAdaptedResume(
    analysis.resumeText,
    analysis.jobDescriptionText,
    {
      summary: analysis.summary,
      keywordsMissing: analysis.keywordsMissing,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
    }
  );
  await saveAdaptedResume(analysis.id, adaptedResume);
  return adaptedResume;
}

// Biblioteca de currículos: toda análise para a qual já geramos uma versão
// adaptada representa uma versão de CV salva, reutilizável como ponto de
// partida para uma nova análise.
export async function listAdaptedResumesForUser(userId: string) {
  const analyses = await prisma.analysis.findMany({
    where: { userId },
    select: {
      id: true,
      score: true,
      jobDescriptionText: true,
      createdAt: true,
      adaptedResume: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return analyses
    .filter((analysis) => analysis.adaptedResume !== null)
    .map((analysis) => ({
      id: analysis.id,
      score: analysis.score,
      jobDescriptionText: analysis.jobDescriptionText,
      createdAt: analysis.createdAt,
      adaptedResume: analysis.adaptedResume as AdaptedResume,
    }));
}
