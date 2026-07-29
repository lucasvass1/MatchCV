"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SelectNative } from "@/components/ui/select-native";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { APPLICATION_STATUSES, APPLICATION_STATUS_LABEL } from "@/lib/job-application";
import type { AnalysisOption, JobApplicationDTO } from "@/components/job-applications/types";

function analysisLabel(analysis: AnalysisOption) {
  const preview = analysis.jobDescriptionText.trim().slice(0, 60);
  const date = new Date(analysis.createdAt).toLocaleDateString("pt-BR");
  return `${date} · ${analysis.score}% · ${preview}${preview.length === 60 ? "…" : ""}`;
}

export function CreateApplicationForm({
  analyses,
  onCreated,
  onCancel,
  onAnalysisDeleted,
}: {
  analyses: AnalysisOption[];
  onCreated: (jobApplication: JobApplicationDTO) => void;
  onCancel: () => void;
  onAnalysisDeleted: (id: string) => void;
}) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState(APPLICATION_STATUSES[0]);
  const [jobUrl, setJobUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [analysisId, setAnalysisId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingAnalysisDelete, setConfirmingAnalysisDelete] = useState(false);
  const [isDeletingAnalysis, setIsDeletingAnalysis] = useState(false);
  const [deleteAnalysisError, setDeleteAnalysisError] = useState<string | null>(null);

  async function handleDeleteAnalysis() {
    if (!analysisId) return;
    setIsDeletingAnalysis(true);
    setDeleteAnalysisError(null);
    try {
      const response = await fetch(`/api/analysis/${analysisId}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Não foi possível excluir a análise.");
      }
      onAnalysisDeleted(analysisId);
      setAnalysisId("");
      setConfirmingAnalysisDelete(false);
    } catch (err) {
      setDeleteAnalysisError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setIsDeletingAnalysis(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!company.trim() || !role.trim()) {
      setError("Informe a empresa e o cargo.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/job-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: company.trim(),
          role: role.trim(),
          status,
          jobUrl: jobUrl.trim() || null,
          notes: notes.trim() || null,
          analysisId: analysisId || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Não foi possível criar a candidatura.");
      }

      onCreated(data.jobApplication as JobApplicationDTO);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova candidatura</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="company">Empresa</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Ex: Acme Inc."
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="role">Cargo</Label>
              <Input
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Ex: Desenvolvedor Backend"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="status">Status</Label>
              <SelectNative
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
              >
                {APPLICATION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {APPLICATION_STATUS_LABEL[s]}
                  </option>
                ))}
              </SelectNative>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="jobUrl">Link da vaga (opcional)</Label>
              <Input
                id="jobUrl"
                type="url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          {analyses.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="analysisId">Currículo usado (opcional)</Label>
              <div className="flex gap-2">
                <SelectNative
                  id="analysisId"
                  className="flex-1"
                  value={analysisId}
                  onChange={(e) => {
                    setAnalysisId(e.target.value);
                    setConfirmingAnalysisDelete(false);
                    setDeleteAnalysisError(null);
                  }}
                >
                  <option value="">Nenhum</option>
                  {analyses.map((analysis) => (
                    <option key={analysis.id} value={analysis.id}>
                      {analysisLabel(analysis)}
                    </option>
                  ))}
                </SelectNative>
                {analysisId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    title="Excluir esta análise"
                    onClick={() => setConfirmingAnalysisDelete(true)}
                    disabled={isDeletingAnalysis}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>

              {deleteAnalysisError && (
                <Alert variant="destructive">
                  <AlertCircle className="size-4" />
                  <AlertTitle>{deleteAnalysisError}</AlertTitle>
                </Alert>
              )}

              {confirmingAnalysisDelete && (
                <Alert variant="destructive">
                  <AlertTriangle className="size-4" />
                  <AlertTitle>Esta análise será apagada por completo</AlertTitle>
                  <AlertDescription>
                    Ela some da biblioteca, da comparação de versões e do gráfico em
                    &quot;Meu progresso&quot;. Candidaturas vinculadas a ela continuam
                    existindo, só perdem essa referência. Essa ação não pode ser desfeita.
                  </AlertDescription>
                  <div className="mt-2 flex justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => setConfirmingAnalysisDelete(false)}
                      disabled={isDeletingAnalysis}
                    >
                      <X className="size-3" />
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="xs"
                      onClick={handleDeleteAnalysis}
                      disabled={isDeletingAnalysis}
                    >
                      {isDeletingAnalysis ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Trash2 className="size-3" />
                      )}
                      Confirmar exclusão
                    </Button>
                  </div>
                </Alert>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contatos, próximos passos, impressões..."
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {isSubmitting ? "Salvando..." : "Adicionar candidatura"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
