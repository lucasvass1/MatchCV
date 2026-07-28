import { prisma } from "@/lib/prisma";
import type { AdaptedResume, AnalysisResult } from "@/lib/gemini";

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
