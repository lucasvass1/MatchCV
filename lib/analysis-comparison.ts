import { compareAnalyses, type ComparisonInsight, type ComparisonKeywordDiff } from "@/lib/gemini";
import type { getOwnedAnalysis } from "@/lib/analysis-repository";

type OwnedAnalysis = NonNullable<Awaited<ReturnType<typeof getOwnedAnalysis>>>;

function diffKeywords(previous: OwnedAnalysis, current: OwnedAnalysis): ComparisonKeywordDiff {
  const previousMatched = new Set(previous.keywordsMatched);
  const previousMissing = new Set(previous.keywordsMissing);
  const currentMatched = new Set(current.keywordsMatched);

  return {
    newlyMatched: current.keywordsMatched.filter((k) => !previousMatched.has(k)),
    resolvedGaps: previous.keywordsMissing.filter((k) => currentMatched.has(k)),
    newGaps: current.keywordsMissing.filter((k) => !previousMissing.has(k)),
    stillMissing: current.keywordsMissing.filter((k) => previousMissing.has(k)),
  };
}

export type AnalysisComparison = {
  previous: { id: string; score: number; createdAt: Date; jobDescriptionText: string };
  current: { id: string; score: number; createdAt: Date; jobDescriptionText: string };
  scoreDelta: number;
  keywordDiff: ComparisonKeywordDiff;
  insight: ComparisonInsight;
};

export async function compareAnalysisVersions(
  previous: OwnedAnalysis,
  current: OwnedAnalysis
): Promise<AnalysisComparison> {
  const keywordDiff = diffKeywords(previous, current);

  const insight = await compareAnalyses(
    {
      score: previous.score,
      summary: previous.summary,
      strengths: previous.strengths,
      weaknesses: previous.weaknesses,
    },
    {
      score: current.score,
      summary: current.summary,
      strengths: current.strengths,
      weaknesses: current.weaknesses,
    },
    keywordDiff
  );

  return {
    previous: {
      id: previous.id,
      score: previous.score,
      createdAt: previous.createdAt,
      jobDescriptionText: previous.jobDescriptionText,
    },
    current: {
      id: current.id,
      score: current.score,
      createdAt: current.createdAt,
      jobDescriptionText: current.jobDescriptionText,
    },
    scoreDelta: current.score - previous.score,
    keywordDiff,
    insight,
  };
}
