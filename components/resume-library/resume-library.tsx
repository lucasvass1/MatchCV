"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  AlertTriangle,
  Download,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import type { AdaptedResume } from "@/lib/gemini";

export type ResumeLibraryItem = {
  id: string;
  score: number;
  jobDescriptionText: string;
  createdAt: Date;
  adaptedResume: AdaptedResume;
};

export function ResumeLibrary({ resumes: initialResumes }: { resumes: ResumeLibraryItem[] }) {
  const [resumes, setResumes] = useState(initialResumes);
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

  function handleDeleted(id: string) {
    setResumes((prev) => prev.filter((resume) => resume.id !== id));
  }

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
            <ResumeLibraryCard key={resume.id} resume={resume} onDeleted={handleDeleted} />
          ))}
        </div>
      )}
    </div>
  );
}

function ResumeLibraryCard({
  resume,
  onDeleted,
}: {
  resume: ResumeLibraryItem;
  onDeleted: (id: string) => void;
}) {
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
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
    router.push(`/analisar?reuseAnalysisId=${resume.id}`);
  }

  async function handleDelete() {
    setIsDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/analysis/${resume.id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Não foi possível excluir a análise.");
      }
      onDeleted(resume.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
      setIsDeleting(false);
    }
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

        {confirmingDelete && (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertTitle>Esta análise será apagada por completo</AlertTitle>
            <AlertDescription>
              Ela some da biblioteca, da comparação de versões e do gráfico em
              &quot;Meu progresso&quot;. Se estiver vinculada a uma candidatura em
              &quot;Minhas vagas&quot;, a candidatura continua existindo, só perde a
              referência a este currículo. Essa ação não pode ser desfeita.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-end gap-1">
          {confirmingDelete ? (
            <>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setConfirmingDelete(false)}
                disabled={isDeleting}
              >
                <X className="size-3" />
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="xs"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Trash2 className="size-3" />
                )}
                Confirmar exclusão
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="xs" onClick={() => setConfirmingDelete(true)}>
              <Trash2 className="size-3" />
              Excluir
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
