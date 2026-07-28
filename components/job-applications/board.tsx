"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { APPLICATION_STATUSES, APPLICATION_STATUS_LABEL } from "@/lib/job-application";
import type { AnalysisOption, JobApplicationDTO } from "@/components/job-applications/types";
import { CreateApplicationForm } from "@/components/job-applications/create-application-form";
import { ApplicationCard } from "@/components/job-applications/application-card";

export function JobApplicationsBoard({
  initialJobApplications,
  analyses,
}: {
  initialJobApplications: JobApplicationDTO[];
  analyses: AnalysisOption[];
}) {
  const [jobApplications, setJobApplications] = useState(initialJobApplications);
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);

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
        />
      )}

      {jobApplications.length === 0 && !isCreating ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          Nenhuma candidatura cadastrada ainda. Clique em &quot;Nova candidatura&quot; para
          começar a acompanhar suas aplicações.
        </div>
      ) : (
        <div className="grid gap-4 overflow-x-auto pb-2 sm:grid-cols-2 lg:grid-cols-5">
          {APPLICATION_STATUSES.map((status) => (
            <div key={status} className="flex min-w-0 flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">{APPLICATION_STATUS_LABEL[status]}</h2>
                <span className="text-xs text-muted-foreground">
                  {columns.get(status)?.length ?? 0}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {columns.get(status)?.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    jobApplication={app}
                    onUpdated={handleUpdated}
                    onDeleted={handleDeleted}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
