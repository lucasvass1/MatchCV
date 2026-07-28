import type { ApplicationStatus } from "@/lib/job-application";

export type AnalysisOption = {
  id: string;
  score: number;
  jobDescriptionText: string;
  createdAt: Date;
};

export type JobApplicationDTO = {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  jobUrl: string | null;
  notes: string | null;
  analysisId: string | null;
  analysis: { id: string; score: number } | null;
  appliedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};
