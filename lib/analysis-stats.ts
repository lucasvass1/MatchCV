export type ScoreTimelinePoint = {
  analysisId: string;
  createdAt: Date;
  score: number;
};

export type KeywordStat = {
  keyword: string;
  timesSeen: number;
  timesMatched: number;
  matchRate: number;
};

export type AnalysisStats = {
  totalAnalyses: number;
  averageScore: number | null;
  scoreTimeline: ScoreTimelinePoint[];
  topRecurringKeywords: KeywordStat[];
  topAdherenceKeywords: KeywordStat[];
};

type AnalysisForStats = {
  id: string;
  score: number;
  createdAt: Date;
  keywordsMatched: string[];
  keywordsMissing: string[];
};

const TOP_KEYWORDS_LIMIT = 8;

export function buildAnalysisStats(analyses: AnalysisForStats[]): AnalysisStats {
  const totalAnalyses = analyses.length;
  const averageScore =
    totalAnalyses === 0
      ? null
      : Math.round(analyses.reduce((sum, a) => sum + a.score, 0) / totalAnalyses);

  const scoreTimeline = [...analyses]
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((a) => ({ analysisId: a.id, createdAt: a.createdAt, score: a.score }));

  // Chave normalizada (minúsculas) para agrupar variações de grafia da mesma
  // palavra-chave entre análises diferentes (ex: "AWS" vs "aws"); o rótulo
  // exibido usa a primeira grafia encontrada.
  const keywordMap = new Map<
    string,
    { display: string; timesSeen: number; timesMatched: number }
  >();

  function addKeyword(rawKeyword: string, matched: boolean) {
    const display = rawKeyword.trim();
    if (!display) return;
    const key = display.toLowerCase();
    const entry = keywordMap.get(key) ?? { display, timesSeen: 0, timesMatched: 0 };
    entry.timesSeen += 1;
    if (matched) entry.timesMatched += 1;
    keywordMap.set(key, entry);
  }

  for (const analysis of analyses) {
    for (const keyword of analysis.keywordsMatched) addKeyword(keyword, true);
    for (const keyword of analysis.keywordsMissing) addKeyword(keyword, false);
  }

  const keywordStats: KeywordStat[] = Array.from(keywordMap.values()).map((entry) => ({
    keyword: entry.display,
    timesSeen: entry.timesSeen,
    timesMatched: entry.timesMatched,
    matchRate: Math.round((entry.timesMatched / entry.timesSeen) * 100),
  }));

  const topRecurringKeywords = [...keywordStats]
    .sort((a, b) => b.timesSeen - a.timesSeen)
    .slice(0, TOP_KEYWORDS_LIMIT);

  // Exige aparecer em mais de uma análise para entrar no ranking de
  // aderência, evitando que uma única ocorrência combinada pareça 100%.
  const adherenceMinOccurrences = totalAnalyses >= 3 ? 2 : 1;
  const topAdherenceKeywords = keywordStats
    .filter((k) => k.timesSeen >= adherenceMinOccurrences)
    .sort((a, b) => b.matchRate - a.matchRate || b.timesSeen - a.timesSeen)
    .slice(0, TOP_KEYWORDS_LIMIT);

  return {
    totalAnalyses,
    averageScore,
    scoreTimeline,
    topRecurringKeywords,
    topAdherenceKeywords,
  };
}
