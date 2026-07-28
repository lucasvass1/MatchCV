"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { ScoreBar, scoreTextClass } from "@/components/score-bar";
import { AnimatedNumber } from "@/components/animated-number";
import { Alert, AlertTitle } from "@/components/ui/alert";
import {
  Lock,
  AlertCircle,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BookOpen,
  MessagesSquare,
  Download,
  MessageCircle,
  FileText,
  X,
  Circle,
} from "lucide-react";
import type {
  AnalysisPreview,
  AnalysisResult,
  Recommendation,
} from "@/lib/gemini";
import type { ChecklistItem } from "@/lib/application-checklist";

const ACCEPTED_EXTENSIONS = ".pdf,.docx";
const PENDING_ANALYSIS_ID_KEY = "matchcv:pendingAnalysisId";

type ReusedResume = {
  resumeText: string;
  jobDescriptionText: string;
  score: number;
};

export function AnalysisWorkspace() {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const router = useRouter();
  const searchParams = useSearchParams();
  const reuseAnalysisId = searchParams.get("reuseAnalysisId");

  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[] | null>(null);
  const [preview, setPreview] = useState<AnalysisPreview | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(() =>
    typeof window === "undefined"
      ? null
      : sessionStorage.getItem(PENDING_ANALYSIS_ID_KEY)
  );
  const [reusedResume, setReusedResume] = useState<ReusedResume | null>(null);
  const [isLoadingReuse, setIsLoadingReuse] = useState(false);
  const claimedIdRef = useRef<string | null>(null);
  const reusedIdRef = useRef<string | null>(null);

  const isClaiming = isAuthenticated && pendingId !== null && !result;

  // Carrega o texto de um currículo adaptado salvo (biblioteca de currículos)
  // para usar como ponto de partida desta análise, em vez de fazer upload de
  // arquivo. A ref evita recarregar o mesmo id duas vezes (ex: StrictMode).
  useEffect(() => {
    if (!reuseAnalysisId || reusedIdRef.current === reuseAnalysisId) return;
    reusedIdRef.current = reuseAnalysisId;
    setIsLoadingReuse(true);

    fetch(`/api/analysis/${reuseAnalysisId}/adapted-resume/text`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Não foi possível carregar o currículo salvo.");
        }
        setReusedResume({
          resumeText: data.resumeText as string,
          jobDescriptionText: data.jobDescriptionText as string,
          score: data.score as number,
        });
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : "Não foi possível carregar o currículo salvo."
        );
      })
      .finally(() => {
        setIsLoadingReuse(false);
      });
  }, [reuseAnalysisId]);

  function clearReusedResume() {
    setReusedResume(null);
    reusedIdRef.current = null;
    router.replace("/analisar");
  }

  // Depois do login, troca o id da análise anônima (salvo no navegador) pelo
  // resultado completo no servidor — nenhum dado protegido chega a ficar no
  // navegador antes da autenticação. A ref evita reivindicar o mesmo id duas
  // vezes (ex: StrictMode em dev), já que o claim no servidor é de uso único.
  useEffect(() => {
    if (!isClaiming || !pendingId) return;
    if (claimedIdRef.current === pendingId) return;
    claimedIdRef.current = pendingId;

    fetch(`/api/analysis/${pendingId}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Não foi possível recuperar a análise.");
        }
        setResult(data.result as AnalysisResult);
        setAnalysisId(data.analysisId as string);
        setChecklist(data.checklist as ChecklistItem[]);
        setPreview(null);
      })
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível recuperar sua análise anterior."
        );
      })
      .finally(() => {
        sessionStorage.removeItem(PENDING_ANALYSIS_ID_KEY);
        setPendingId(null);
      });
  }, [isClaiming, pendingId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!file && !reusedResume) {
      setError("Selecione o arquivo do seu currículo (PDF ou DOCX).");
      return;
    }
    if (jobDescription.trim().length < 50) {
      setError("Cole a descrição completa da vaga (mínimo 50 caracteres).");
      return;
    }

    setIsLoading(true);
    setResult(null);
    setAnalysisId(null);
    setChecklist(null);
    setPreview(null);

    try {
      const formData = new FormData();
      if (reusedResume) {
        formData.append("resumeText", reusedResume.resumeText);
      } else if (file) {
        formData.append("resume", file);
      }
      formData.append("jobDescription", jobDescription);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Não foi possível concluir a análise.");
      }

      if (isAuthenticated) {
        setResult(data.result as AnalysisResult);
        setAnalysisId(data.analysisId as string);
        setChecklist(data.checklist as ChecklistItem[]);
        sessionStorage.removeItem(PENDING_ANALYSIS_ID_KEY);
        setPendingId(null);
      } else {
        setPreview(data.preview as AnalysisPreview);
        sessionStorage.setItem(PENDING_ANALYSIS_ID_KEY, data.analysisId as string);
        setPendingId(data.analysisId as string);
      }

      if (reusedResume) {
        setReusedResume(null);
        reusedIdRef.current = null;
        router.replace("/analisar");
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
            {isLoadingReuse ? (
              <div className="flex items-center gap-2 rounded-lg border p-4 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Carregando currículo salvo...
              </div>
            ) : reusedResume ? (
              <div className="flex items-start justify-between gap-3 rounded-lg border bg-muted/50 p-4">
                <div className="flex items-start gap-2">
                  <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <p className="text-sm">
                    Reutilizando um currículo adaptado ({reusedResume.score}% de
                    compatibilidade na vaga original) como ponto de partida.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearReusedResume}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  aria-label="Trocar currículo"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <label htmlFor="resume" className="text-sm font-medium">
                  Currículo (PDF ou DOCX)
                </label>
                <input
                  id="resume"
                  name="resume"
                  type="file"
                  accept={ACCEPTED_EXTENSIONS}
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="cursor-pointer rounded-md border border-input bg-transparent text-sm file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-secondary/80"
                />
              </div>
            )}

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
              <Alert variant="destructive" className="mcv-fade-up">
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

      {isClaiming && (
        <Card className="mcv-fade">
          <CardContent className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Recuperando sua análise...
          </CardContent>
        </Card>
      )}

      {result && analysisId && checklist && (
        <FullResultCard result={result} analysisId={analysisId} initialChecklist={checklist} />
      )}
      {!result && preview && <PreviewResultCard preview={preview} />}
    </div>
  );
}

function FullResultCard({
  result,
  analysisId,
  initialChecklist,
}: {
  result: AnalysisResult;
  analysisId: string;
  initialChecklist: ChecklistItem[];
}) {
  const [checklist, setChecklist] = useState(initialChecklist);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  function markAdaptedResumeReady() {
    setChecklist((items) =>
      items.map((item) =>
        item.id === "adapted-resume"
          ? { ...item, status: "done", detail: "Currículo adaptado já gerado." }
          : item
      )
    );
  }

  async function handleDownloadAdaptedResume() {
    setIsDownloading(true);
    setDownloadError(null);

    try {
      const response = await fetch(`/api/analysis/${analysisId}/adapted-resume`);
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Não foi possível gerar o currículo adaptado.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "curriculo-adaptado.docx";
      link.click();
      URL.revokeObjectURL(url);
      markAdaptedResumeReady();
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="mcv-fade-up flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Resultado da análise</CardTitle>
          <CardDescription>Análise completa da sua compatibilidade</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <ScoreBlock score={result.score} />

          <div className="grid gap-2 sm:grid-cols-2">
            <DownloadAdaptedResumeButton
              isDownloading={isDownloading}
              error={downloadError}
              onClick={handleDownloadAdaptedResume}
            />
            <StartInterviewButton analysisId={analysisId} />
          </div>

          {result.keywordsMatched.length > 0 && (
            <MatchedKeywordsBlock keywords={result.keywordsMatched.slice(0, 3)} />
          )}

          <RecommendationBlock recommendation={result.recommendation} />

          <div className="space-y-4 rounded-lg border p-4">
            <div>
              <p className="text-sm font-semibold">Explicação do score</p>
              <p className="text-sm text-muted-foreground">{result.summary}</p>
            </div>
            <div>
              <p className="text-sm font-semibold">Palavras-chave ausentes</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {result.keywordsMissing.map((keyword, i) => (
                  <Badge
                    key={keyword}
                    variant="outline"
                    className="mcv-pop"
                    style={{ animationDelay: `${i * 45}ms` }}
                  >
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
        </CardContent>
      </Card>

      <ChecklistCard
        checklist={checklist}
        isDownloadingAdaptedResume={isDownloading}
        onDownloadAdaptedResume={handleDownloadAdaptedResume}
      />

      <Card>
        <CardHeader>
          <CardTitle>Como melhorar seu currículo</CardTitle>
          <CardDescription>
            Ajustes na apresentação da sua experiência real para esta vaga
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {result.improvementTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessagesSquare className="size-4" />
            Preparação para a entrevista
          </CardTitle>
          <CardDescription>
            Dicas de postura e perguntas prováveis para esta vaga
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {result.interviewTips.length > 0 && (
            <div>
              <p className="text-sm font-semibold">Dicas de comportamento</p>
              <ul className="list-disc space-y-1 pl-5 pt-1 text-sm text-muted-foreground">
                {result.interviewTips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {result.interviewQuestions.length > 0 && (
            <div className="flex flex-col gap-3">
              <InterviewQuestionsGroup
                title="Perguntas técnicas"
                questions={result.interviewQuestions
                  .filter((q) => q.type === "technical")
                  .map((q) => q.question)}
              />
              <InterviewQuestionsGroup
                title="Perguntas comportamentais"
                questions={result.interviewQuestions
                  .filter((q) => q.type === "behavioral")
                  .map((q) => q.question)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="size-4" />
            O que estudar para esta vaga
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {result.studySuggestions.map((topic, i) => (
              <Badge
                key={topic}
                variant="secondary"
                className="mcv-pop"
                style={{ animationDelay: `${i * 45}ms` }}
              >
                {topic}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DownloadAdaptedResumeButton({
  isDownloading,
  error,
  onClick,
}: {
  isDownloading: boolean;
  error: string | null;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Button variant="outline" className="w-full" disabled={isDownloading} onClick={onClick}>
        {isDownloading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Download className="size-4" />
        )}
        {isDownloading ? "Gerando currículo adaptado..." : "Baixar currículo adaptado"}
      </Button>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      )}
    </div>
  );
}

function StartInterviewButton({ analysisId }: { analysisId: string }) {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setIsStarting(true);
    setError(null);

    try {
      const response = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Não foi possível iniciar a entrevista.");
      }

      router.push(`/entrevista/${data.interviewSession.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
      setIsStarting(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        className="w-full"
        disabled={isStarting}
        onClick={handleStart}
      >
        {isStarting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <MessageCircle className="size-4" />
        )}
        {isStarting ? "Preparando entrevista..." : "Simular entrevista"}
      </Button>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      )}
    </div>
  );
}

function InterviewQuestionsGroup({
  title,
  questions,
}: {
  title: string;
  questions: string[];
}) {
  if (questions.length === 0) return null;
  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <ul className="list-disc space-y-1 pl-5 pt-1 text-sm text-muted-foreground">
        {questions.map((question) => (
          <li key={question}>{question}</li>
        ))}
      </ul>
    </div>
  );
}

const RECOMMENDATION_CONFIG = {
  recommended: {
    label: "Vale a pena se candidatar",
    icon: CheckCircle2,
    className:
      "border-emerald-600/30 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  },
  possible: {
    label: "Compatibilidade parcial — avalie com cuidado",
    icon: AlertTriangle,
    className:
      "border-amber-600/30 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  },
  not_recommended: {
    label: "Provavelmente não vale a pena agora",
    icon: XCircle,
    className:
      "border-red-600/30 bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-200",
  },
} satisfies Record<
  Recommendation["verdict"],
  { label: string; icon: typeof CheckCircle2; className: string }
>;

function RecommendationBlock({
  recommendation,
}: {
  recommendation: Recommendation;
}) {
  const config = RECOMMENDATION_CONFIG[recommendation.verdict];
  const Icon = config.icon;

  return (
    <div className={`rounded-lg border p-4 ${config.className}`}>
      <div className="flex items-center gap-2 font-semibold">
        <Icon className="size-4 shrink-0" />
        {config.label}
      </div>
      <p className="pt-1 text-sm opacity-90">{recommendation.reasoning}</p>
    </div>
  );
}

const CHECKLIST_STATUS_CONFIG = {
  done: {
    icon: CheckCircle2,
    className: "text-emerald-600 dark:text-emerald-400",
  },
  warning: {
    icon: AlertTriangle,
    className: "text-amber-600 dark:text-amber-400",
  },
  missing: {
    icon: Circle,
    className: "text-muted-foreground",
  },
} satisfies Record<
  ChecklistItem["status"],
  { icon: typeof CheckCircle2; className: string }
>;

function ChecklistCard({
  checklist,
  isDownloadingAdaptedResume,
  onDownloadAdaptedResume,
}: {
  checklist: ChecklistItem[];
  isDownloadingAdaptedResume: boolean;
  onDownloadAdaptedResume: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Checklist antes de aplicar</CardTitle>
        <CardDescription>
          Itens que costumam fazer diferença antes de enviar sua candidatura
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {checklist.map((item) => {
          // Só "Currículo adaptado" tem uma ação disponível dentro do app
          // (baixar); os demais itens dependem de editar o arquivo do
          // currículo fora daqui, então ficam só como leitura.
          const isAdaptedResumeItem = item.id === "adapted-resume";
          const isClickable = isAdaptedResumeItem && item.status !== "done";
          const isSpinning = isAdaptedResumeItem && isDownloadingAdaptedResume;
          const config = CHECKLIST_STATUS_CONFIG[item.status];
          const Icon = isSpinning ? Loader2 : config.icon;

          const row = (
            <div className="flex items-start gap-3">
              <Icon
                className={`mt-0.5 size-4 shrink-0 ${config.className} ${
                  isSpinning ? "animate-spin" : ""
                }`}
              />
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.detail}</p>
              </div>
            </div>
          );

          if (isClickable) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={onDownloadAdaptedResume}
                disabled={isDownloadingAdaptedResume}
                className="-mx-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted disabled:cursor-not-allowed"
              >
                {row}
              </button>
            );
          }

          return (
            <div key={item.id} className="px-2 py-2">
              {row}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function PreviewResultCard({ preview }: { preview: AnalysisPreview }) {
  return (
    <Card className="mcv-fade-up">
      <CardHeader>
        <CardTitle>Resultado da análise</CardTitle>
        <CardDescription>Prévia gratuita da sua compatibilidade</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <ScoreBlock score={preview.score} />

        {preview.keywordsMatchedPreview.length > 0 && (
          <MatchedKeywordsBlock keywords={preview.keywordsMatchedPreview} />
        )}

        <div className="relative overflow-hidden rounded-lg border">
          <div
            aria-hidden
            className="pointer-events-none select-none space-y-4 p-4 blur-sm"
          >
            <div>
              <p className="text-sm font-semibold">Explicação do score</p>
              <p className="text-sm text-muted-foreground">
                Lorem ipsum dolor sit amet consectetur adipiscing elit sed do.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold">Palavras-chave ausentes</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="outline">••••••</Badge>
                <Badge variant="outline">••••••</Badge>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold">Pontos fortes</p>
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                <li>Lorem ipsum dolor sit amet</li>
                <li>Consectetur adipiscing elit</li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold">Pontos fracos</p>
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                <li>Lorem ipsum dolor sit amet</li>
                <li>Consectetur adipiscing elit</li>
              </ul>
            </div>
          </div>

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
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreBlock({ score }: { score: number }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Compatibilidade
        </span>
        <AnimatedNumber
          value={score}
          suffix="%"
          className={`text-3xl font-bold ${scoreTextClass(score)}`}
        />
      </div>
      <ScoreBar score={score} />
    </div>
  );
}

function MatchedKeywordsBlock({ keywords }: { keywords: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-muted-foreground">
        Algumas palavras-chave encontradas
      </span>
      <div className="flex flex-wrap gap-2">
        {keywords.map((keyword, i) => (
          <Badge
            key={keyword}
            variant="secondary"
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
