"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Lock, AlertCircle, Loader2 } from "lucide-react";
import type { AnalysisResult } from "@/lib/gemini";

const ACCEPTED_EXTENSIONS = ".pdf,.docx";
const PENDING_RESULT_KEY = "matchcv:pendingAnalysisResult";

export function AnalysisWorkspace() {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Recupera a análise feita antes do login (salva no navegador) para não
  // obrigar o usuário a refazer o upload depois de criar a conta. Ajustar o
  // estado durante a renderização evita uma renderização em cascata; a
  // condição `!result` garante que isso só acontece uma vez, pois setResult
  // torna a condição falsa nas próximas renderizações.
  if (isAuthenticated && !result) {
    const pending = sessionStorage.getItem(PENDING_RESULT_KEY);
    if (pending) {
      try {
        setResult(JSON.parse(pending) as AnalysisResult);
      } catch {
        sessionStorage.removeItem(PENDING_RESULT_KEY);
      }
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!file) {
      setError("Selecione o arquivo do seu currículo (PDF ou DOCX).");
      return;
    }
    if (jobDescription.trim().length < 50) {
      setError("Cole a descrição completa da vaga (mínimo 50 caracteres).");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("jobDescription", jobDescription);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Não foi possível concluir a análise.");
      }

      const analysisResult = data.result as AnalysisResult;
      setResult(analysisResult);

      if (!isAuthenticated) {
        sessionStorage.setItem(
          PENDING_RESULT_KEY,
          JSON.stringify(analysisResult)
        );
      } else {
        sessionStorage.removeItem(PENDING_RESULT_KEY);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Analise seu currículo</CardTitle>
          <CardDescription>
            Envie seu currículo e cole a descrição da vaga para ver o quão
            compatível você está com a oportunidade.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="resume" className="text-sm font-medium">
                Currículo (PDF ou DOCX)
              </label>
              <input
                ref={fileInputRef}
                id="resume"
                name="resume"
                type="file"
                accept={ACCEPTED_EXTENSIONS}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="cursor-pointer rounded-md border border-input bg-transparent text-sm file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-secondary/80"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="jobDescription" className="text-sm font-medium">
                Descrição da vaga
              </label>
              <Textarea
                id="jobDescription"
                placeholder="Cole aqui o texto completo da vaga..."
                rows={10}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertTitle>{error}</AlertTitle>
              </Alert>
            )}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading && <Loader2 className="size-4 animate-spin" />}
              {isLoading ? "Analisando..." : "Analisar compatibilidade"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <AnalysisResultPreview result={result} isAuthenticated={isAuthenticated} />
      )}
    </div>
  );
}

function AnalysisResultPreview({
  result,
  isAuthenticated,
}: {
  result: AnalysisResult;
  isAuthenticated: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resultado da análise</CardTitle>
        <CardDescription>
          {isAuthenticated
            ? "Análise completa da sua compatibilidade"
            : "Prévia gratuita da sua compatibilidade"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Compatibilidade
            </span>
            <span className="text-3xl font-bold">{result.score}%</span>
          </div>
          <Progress value={result.score} />
        </div>

        {result.keywordsMatched.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              Algumas palavras-chave encontradas
            </span>
            <div className="flex flex-wrap gap-2">
              {result.keywordsMatched.slice(0, 3).map((keyword) => (
                <Badge key={keyword} variant="secondary">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="relative overflow-hidden rounded-lg border">
          <div
            aria-hidden={!isAuthenticated}
            className={
              isAuthenticated
                ? "space-y-4 p-4"
                : "pointer-events-none select-none space-y-4 p-4 blur-sm"
            }
          >
            <div>
              <p className="text-sm font-semibold">Explicação do score</p>
              <p className="text-sm text-muted-foreground">{result.summary}</p>
            </div>
            <div>
              <p className="text-sm font-semibold">Palavras-chave ausentes</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {result.keywordsMissing.map((keyword) => (
                  <Badge key={keyword} variant="outline">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold">Pontos fortes</p>
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                {result.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold">Pontos fracos</p>
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                {result.weaknesses.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          {!isAuthenticated && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/60 p-6 text-center">
              <Lock className="size-6 text-muted-foreground" />
              <p className="max-w-xs text-sm font-medium">
                Crie sua conta para desbloquear a análise completa
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  nativeButton={false}
                  render={<Link href="/login" />}
                >
                  Entrar
                </Button>
                <Button size="sm" nativeButton={false} render={<Link href="/register" />}>
                  Criar conta
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
