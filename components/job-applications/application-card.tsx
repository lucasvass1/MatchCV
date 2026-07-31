"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  ExternalLink,
  Loader2,
  MessageCircle,
  MessageCircleCheck,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { APPLICATION_STATUSES, APPLICATION_STATUS_LABEL } from "@/lib/job-application";
import { cn, formatDate } from "@/lib/utils";
import type { JobApplicationDTO } from "@/components/job-applications/types";

export function ApplicationCard({
  jobApplication,
  onUpdated,
  onDeleted,
}: {
  jobApplication: JobApplicationDTO;
  onUpdated: (jobApplication: JobApplicationDTO) => void;
  onDeleted: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [isTogglingContact, setIsTogglingContact] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>) {
    const response = await fetch(`/api/job-applications/${jobApplication.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error ?? "Não foi possível atualizar a candidatura.");
    }
    return data.jobApplication as JobApplicationDTO;
  }

  async function handleStatusChange(status: string) {
    setError(null);
    setIsChangingStatus(true);
    try {
      const updated = await patch({ status });
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setIsChangingStatus(false);
    }
  }

  async function handleToggleContact() {
    setError(null);
    setIsTogglingContact(true);
    try {
      const updated = await patch({ recruiterContacted: !jobApplication.recruiterContactedAt });
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setIsTogglingContact(false);
    }
  }

  async function handleDelete() {
    setError(null);
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/job-applications/${jobApplication.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Não foi possível excluir a candidatura.");
      }
      onDeleted(jobApplication.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
      setIsDeleting(false);
    }
  }

  if (isEditing) {
    return (
      <EditApplicationCard
        jobApplication={jobApplication}
        onSaved={(updated) => {
          onUpdated(updated);
          setIsEditing(false);
        }}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-semibold">{jobApplication.company}</p>
            <p className="truncate text-sm text-muted-foreground">{jobApplication.role}</p>
          </div>
          {jobApplication.analysis && (
            <Badge variant="secondary" className="shrink-0">
              {jobApplication.analysis.score}%
            </Badge>
          )}
        </div>

        {jobApplication.jobUrl && (
          <a
            href={jobApplication.jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="size-3" />
            Ver vaga
          </a>
        )}

        {jobApplication.notes && (
          <p className="line-clamp-3 text-xs text-muted-foreground">{jobApplication.notes}</p>
        )}

        <p className="text-xs text-muted-foreground">
          Aplicado em {formatDate(jobApplication.appliedAt)}
        </p>

        <button
          type="button"
          onClick={handleToggleContact}
          disabled={isTogglingContact}
          className={cn(
            "inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
            jobApplication.recruiterContactedAt
              ? "border-emerald-600/20 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-400/20 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-950/60"
              : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {isTogglingContact ? (
            <Loader2 className="size-3 animate-spin" />
          ) : jobApplication.recruiterContactedAt ? (
            <MessageCircleCheck className="size-3" />
          ) : (
            <MessageCircle className="size-3" />
          )}
          {jobApplication.recruiterContactedAt
            ? `Recrutador contatado em ${formatDate(jobApplication.recruiterContactedAt)}`
            : "Marcar contato com recrutador"}
        </button>

        <Select
          value={jobApplication.status}
          disabled={isChangingStatus}
          onValueChange={(value) => value && handleStatusChange(value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue>
              {(value: string) => APPLICATION_STATUS_LABEL[value as (typeof APPLICATION_STATUSES)[number]]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {APPLICATION_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {APPLICATION_STATUS_LABEL[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>{error}</AlertTitle>
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
                {isDeleting ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
                Confirmar exclusão
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Editar candidatura"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="size-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Excluir candidatura"
                onClick={() => setConfirmingDelete(true)}
              >
                <Trash2 className="size-3" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EditApplicationCard({
  jobApplication,
  onSaved,
  onCancel,
}: {
  jobApplication: JobApplicationDTO;
  onSaved: (jobApplication: JobApplicationDTO) => void;
  onCancel: () => void;
}) {
  const [company, setCompany] = useState(jobApplication.company);
  const [role, setRole] = useState(jobApplication.role);
  const [jobUrl, setJobUrl] = useState(jobApplication.jobUrl ?? "");
  const [notes, setNotes] = useState(jobApplication.notes ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!company.trim() || !role.trim()) {
      setError("Informe a empresa e o cargo.");
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      const response = await fetch(`/api/job-applications/${jobApplication.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: company.trim(),
          role: role.trim(),
          jobUrl: jobUrl.trim() || null,
          notes: notes.trim() || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Não foi possível salvar as alterações.");
      }
      onSaved(data.jobApplication as JobApplicationDTO);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-2 p-4">
        <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Empresa" />
        <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Cargo" />
        <Input
          type="url"
          value={jobUrl}
          onChange={(e) => setJobUrl(e.target.value)}
          placeholder="Link da vaga (opcional)"
        />
        <Textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notas (opcional)"
        />

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={isSaving}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="size-3 animate-spin" />}
            Salvar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
