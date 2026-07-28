"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { SelectNative } from "@/components/ui/select-native";
import { Badge } from "@/components/ui/badge";
import { ScoreBar, scoreTextClass } from "@/components/score-bar";
import { AnimatedNumber } from "@/components/animated-number";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import type { AnalysisOption } from "@/components/job-applications/types";
import type { AnalysisComparison } from "@/lib/analysis-comparison";

function analysisLabel(analysis: AnalysisOption) {
  const preview = analysis.jobDescriptionText.trim().slice(0, 60);
  const date = new Date(analysis.createdAt).toLocaleDateString("pt-BR");
  return `${date} · ${analysis.score}% · ${preview}${preview.length === 60 ? "…" : ""}`;
}

export function CompareAnalyses({ analyses }: { analyses: AnalysisOption[] }) {
  const [previousId, setPreviousId] = useState(analyses[1]?.id ?? "");
  const [currentId, setCurrentId] = useState(analyses[0]?.id ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparison, setComparison] = useState<AnalysisComparison | null>(null);

  const canCompare =
    analyses.length >= 2 && previousId && currentId && previousId !== currentId;

  async function handleCompare() {
    setError(null);

    if (!canCompare) {
      setError("Selecione duas análises diferentes para comparar.");
      return;
    }

    setIsLoading(true);
    setComparison(null);
    try {
      const response = await fetch("/api/analysis/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ previousId, currentId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Não foi possível comparar as análises.");
      }

      setComparison(data.comparison as AnalysisComparison);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setIsLoading(false);
    }
  }

  if (analyses.length < 2) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Você precisa de pelo menos duas análises para comparar versões. Faça uma
          nova análise para começar a acompanhar sua evolução.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Escolha as versões</CardTitle>
          <CardDescription>
            Selecione a análise anterior e a análise atual para ver o que mudou.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="previousId">Análise anterior</Label>
              <SelectNative
                id="previousId"
                value={previousId}
                onChange={(e) => setPreviousId(e.target.value)}
              >
                {analyses.map((analysis) => (
                  <option key={analysis.id} value={analysis.id}>
                    {analysisLabel(analysis)}
                  </option>
                ))}
              </SelectNative>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="currentId">Análise atual</Label>
              <SelectNative
                id="currentId"
                value={currentId}
                onChange={(e) => setCurrentId(e.target.value)}
              >
                {analyses.map((analysis) => (
                  <option key={analysis.id} value={analysis.id}>
                    {analysisLabel(analysis)}
                  </option>
                ))}
              </SelectNative>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="size-4" />
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          )}

          <Button className="mt-4 w-full" disabled={isLoading} onClick={handleCompare}>
            {isLoading && <Loader2 className="size-4 animate-spin" />}
            {isLoading ? "Comparando..." : "Comparar versões"}
          </Button>
        </CardContent>
      </Card>

      {comparison && <ComparisonResult comparison={comparison} />}
    </div>
  );
}

function ComparisonResult({ comparison }: { comparison: AnalysisComparison }) {
  const { previous, current, scoreDelta, keywordDiff, insight } = comparison;
  const deltaLabel = `${scoreDelta >= 0 ? "+" : ""}${scoreDelta}`;
  const deltaClassName =
    scoreDelta > 0
      ? "text-emerald-600 dark:text-emerald-400"
      : scoreDelta < 0
        ? "text-red-600 dark:text-red-400"
        : "text-muted-foreground";

  return (
    <div className="mcv-fade-up flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Evolução de compatibilidade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 sm:gap-8">
            <ScoreColumn
              label={new Date(previous.createdAt).toLocaleDateString("pt-BR")}
              score={previous.score}
            />
            <ArrowRight className="size-5 shrink-0 text-muted-foreground" />
            <ScoreColumn
              label={new Date(current.createdAt).toLocaleDateString("pt-BR")}
              score={current.score}
            />
            <div className="ml-auto text-right">
              <p className="text-xs text-muted-foreground">Variação</p>
              <p className={`text-2xl font-bold ${deltaClassName}`}>{deltaLabel} pts</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>O que mais contribuiu para a mudança</CardTitle>
          <CardDescription>Resumo gerado por IA a partir das duas análises</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">{insight.summary}</p>
          {insight.keyChanges.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {insight.keyChanges.map((change) => (
                <li key={change}>{change}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Diferenças nas palavras-chave</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <KeywordDiffGroup
            title="Novas palavras-chave presentes agora"
            keywords={keywordDiff.newlyMatched}
            variant="success"
          />
          <KeywordDiffGroup
            title="Lacunas resolvidas"
            keywords={keywordDiff.resolvedGaps}
            variant="success"
          />
          <KeywordDiffGroup
            title="Novas lacunas"
            keywords={keywordDiff.newGaps}
            variant="destructive"
          />
          <KeywordDiffGroup
            title="Ainda ausentes"
            keywords={keywordDiff.stillMissing}
            variant="outline"
          />
        </CardContent>
      </Card>
    </div>
  );
}

function ScoreColumn({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex w-28 flex-col gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <AnimatedNumber
        value={score}
        suffix="%"
        className={`text-2xl font-bold ${scoreTextClass(score)}`}
      />
      <ScoreBar score={score} />
    </div>
  );
}

function KeywordDiffGroup({
  title,
  keywords,
  variant,
}: {
  title: string;
  keywords: string[];
  variant: "success" | "destructive" | "outline";
}) {
  if (keywords.length === 0) return null;
  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <div className="flex flex-wrap gap-2 pt-1">
        {keywords.map((keyword, i) => (
          <Badge
            key={keyword}
            variant={variant}
            className="mcv-pop"
            style={{ animationDelay: `${i * 45}ms` }}
          >
            {keyword}
          </Badge>
        ))}
      </div>
    </div>
  );
}
