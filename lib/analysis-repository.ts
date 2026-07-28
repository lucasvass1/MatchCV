import { prisma } from "@/lib/prisma";
import type { AnalysisResult } from "@/lib/gemini";

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
