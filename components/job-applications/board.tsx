"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Plus, Search } from "lucide-react";
import {
  APPLICATION_STATUSES,
  APPLICATION_STATUS_LABEL,
  isApplicationStatus,
  type ApplicationStatus,
} from "@/lib/job-application";
import { cn } from "@/lib/utils";
import type { AnalysisOption, JobApplicationDTO } from "@/components/job-applications/types";
import { CreateApplicationForm } from "@/components/job-applications/create-application-form";
import { ApplicationCard } from "@/components/job-applications/application-card";

export function JobApplicationsBoard({
  initialJobApplications,
  analyses: initialAnalyses,
}: {
  initialJobApplications: JobApplicationDTO[];
  analyses: AnalysisOption[];
}) {
  const [jobApplications, setJobApplications] = useState(initialJobApplications);
  const [analyses, setAnalyses] = useState(initialAnalyses);
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragError, setDragError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return jobApplications;
    return jobApplications.filter(
      (app) =>
        app.company.toLowerCase().includes(query) || app.role.toLowerCase().includes(query)
    );
  }, [jobApplications, search]);

  const columns = useMemo(() => {
    const grouped = new Map<string, JobApplicationDTO[]>();
    for (const status of APPLICATION_STATUSES) grouped.set(status, []);
    for (const app of filtered) {
      grouped.get(app.status)?.push(app);
    }
    return grouped;
  }, [filtered]);

  const activeApplication = useMemo(
    () => jobApplications.find((app) => app.id === activeId) ?? null,
    [jobApplications, activeId]
  );

  function handleCreated(jobApplication: JobApplicationDTO) {
    setJobApplications((prev) => [jobApplication, ...prev]);
    setIsCreating(false);
  }

  function handleUpdated(jobApplication: JobApplicationDTO) {
    setJobApplications((prev) =>
      prev.map((app) => (app.id === jobApplication.id ? jobApplication : app))
    );
  }

  function handleDeleted(id: string) {
    setJobApplications((prev) => prev.filter((app) => app.id !== id));
  }

  function handleAnalysisDeleted(id: string) {
    setAnalyses((prev) => prev.filter((analysis) => analysis.id !== id));
    setJobApplications((prev) =>
      prev.map((app) =>
        app.analysisId === id ? { ...app, analysisId: null, analysis: null } : app
      )
    );
  }

  function handleDragStart(event: DragStartEvent) {
    setDragError(null);
    setActiveId(String(event.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;
    const newStatus = over.id as string;
    if (!isApplicationStatus(newStatus)) return;

    const current = jobApplications.find((app) => app.id === active.id);
    if (!current || current.status === newStatus) return;

    // Move otimista: já reflete a nova coluna na tela e só reverte se a
    // gravação falhar, para o arrastar-e-soltar parecer instantâneo.
    const previous = jobApplications;
    setJobApplications((prev) =>
      prev.map((app) => (app.id === active.id ? { ...app, status: newStatus } : app))
    );

    try {
      const response = await fetch(`/api/job-applications/${active.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Não foi possível mover a candidatura.");
      }
      setJobApplications((prev) =>
        prev.map((app) => (app.id === data.jobApplication.id ? data.jobApplication : app))
      );
    } catch (err) {
      setJobApplications(previous);
      setDragError(err instanceof Error ? err.message : "Erro inesperado ao mover a candidatura.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por empresa ou cargo..."
            className="pl-8"
          />
        </div>
        <Button onClick={() => setIsCreating((v) => !v)}>
          <Plus className="size-4" />
          Nova candidatura
        </Button>
      </div>

      {isCreating && (
        <CreateApplicationForm
          analyses={analyses}
          onCreated={handleCreated}
          onCancel={() => setIsCreating(false)}
          onAnalysisDeleted={handleAnalysisDeleted}
        />
      )}

      {dragError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>{dragError}</AlertTitle>
        </Alert>
      )}

      {jobApplications.length === 0 && !isCreating ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          Nenhuma candidatura cadastrada ainda. Clique em &quot;Nova candidatura&quot; para
          começar a acompanhar suas aplicações.
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-col gap-4 sm:grid sm:grid-flow-col sm:auto-cols-[minmax(240px,1fr)] sm:overflow-x-auto sm:pb-2 lg:grid-flow-row lg:auto-cols-auto lg:grid-cols-5 lg:overflow-visible">
            {APPLICATION_STATUSES.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                count={columns.get(status)?.length ?? 0}
              >
                {columns.get(status)?.map((app) => (
                  <DraggableCard key={app.id} id={app.id} isActive={activeId === app.id}>
                    <ApplicationCard
                      jobApplication={app}
                      onUpdated={handleUpdated}
                      onDeleted={handleDeleted}
                    />
                  </DraggableCard>
                ))}
              </KanbanColumn>
            ))}
          </div>

          <DragOverlay dropAnimation={{ duration: 220, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }}>
            {activeApplication ? (
              <div className="rotate-2 cursor-grabbing shadow-xl">
                <ApplicationCard
                  jobApplication={activeApplication}
                  onUpdated={() => {}}
                  onDeleted={() => {}}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}

function KanbanColumn({
  status,
  count,
  children,
}: {
  status: ApplicationStatus;
  count: number;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{APPLICATION_STATUS_LABEL[status]}</h2>
        <span className="text-xs text-muted-foreground">{count}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-24 flex-col gap-3 rounded-xl p-1.5 transition-colors",
          isOver && "bg-primary/5 ring-2 ring-primary/30"
        )}
      >
        {children}
      </div>
    </div>
  );
}

function DraggableCard({
  id,
  isActive,
  children,
}: {
  id: string;
  isActive: boolean;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "touch-none cursor-grab active:cursor-grabbing",
        isActive && "opacity-40"
      )}
    >
      {children}
    </div>
  );
}
