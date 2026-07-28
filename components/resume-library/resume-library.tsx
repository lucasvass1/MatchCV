"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Download, Loader2, RefreshCw, Search } from "lucide-react";
import type { AdaptedResume } from "@/lib/gemini";

export type ResumeLibraryItem = {
  id: string;
  score: number;
  jobDescriptionText: string;
  createdAt: Date;
  adaptedResume: AdaptedResume;
};

export function ResumeLibrary({ resumes }: { resumes: ResumeLibraryItem[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return resumes;
    return resumes.filter((resume) => {
      const haystack = [
        resume.adaptedResume.headline,
        resume.adaptedResume.fullName,
        resume.jobDescriptionText,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [resumes, query]);

  if (resumes.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Você ainda não gerou nenhum currículo adaptado. Baixe o currículo adaptado
          de uma análise para começar sua biblioteca.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex w-full max-w-3xl flex-col gap-4">
      <div className="relative">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filtrar por vaga, área ou cargo..."
          className="pl-8"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Nenhum currículo encontrado para essa busca.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((resume) => (
            <ResumeLibraryCard key={resume.id} resume={resume} />
          ))}
        </div>
      )}
    </div>
  );
}

function ResumeLibraryCard({ resume }: { resume: ResumeLibraryItem }) {
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const jobPreview = resume.jobDescriptionText.trim().slice(0, 100);
  const date = new Date(resume.createdAt).toLocaleDateString("pt-BR");

  async function handleDownload() {
    setIsDownloading(true);
    setError(null);
    try {
      const response = await fetch(`/api/analysis/${resume.id}/adapted-resume`);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setIsDownloading(false);
    }
  }

  function handleReuse() {
    router.push(`/?reuseAnalysisId=${resume.id}`);
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="font-semibold">{resume.adaptedResume.headline}</p>
            <p className="text-xs text-muted-foreground">
              {date} · {jobPreview}
              {jobPreview.length === 100 ? "…" : ""}
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {resume.score}%
          </Badge>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={isDownloading}
            onClick={handleDownload}
          >
            {isDownloading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            {isDownloading ? "Gerando..." : "Baixar"}
          </Button>
          <Button size="sm" className="flex-1" onClick={handleReuse}>
            <RefreshCw className="size-4" />
            Usar como base para nova análise
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
