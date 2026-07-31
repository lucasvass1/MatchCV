import { prisma } from "@/lib/prisma";
import type { ApplicationStatus } from "@/lib/job-application";

export type CreateJobApplicationInput = {
  company: string;
  role: string;
  status?: ApplicationStatus;
  jobUrl?: string | null;
  notes?: string | null;
  analysisId?: string | null;
  appliedAt?: Date;
  recruiterContactedAt?: Date | null;
};

export type UpdateJobApplicationInput = {
  company?: string;
  role?: string;
  status?: ApplicationStatus;
  jobUrl?: string | null;
  notes?: string | null;
  analysisId?: string | null;
  appliedAt?: Date;
  recruiterContactedAt?: Date | null;
};

export async function listJobApplicationsForUser(userId: string) {
  return prisma.jobApplication.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { analysis: { select: { id: true, score: true } } },
  });
}

export async function getOwnedJobApplication(id: string, userId: string) {
  const jobApplication = await prisma.jobApplication.findUnique({ where: { id } });
  if (!jobApplication || jobApplication.userId !== userId) return null;
  return jobApplication;
}

export async function createJobApplication(
  userId: string,
  input: CreateJobApplicationInput
) {
  // Garante que o CV vinculado (se houver) realmente pertence ao usuário,
  // já que o id chega direto do cliente.
  if (input.analysisId) {
    const analysis = await prisma.analysis.findUnique({
      where: { id: input.analysisId },
      select: { userId: true },
    });
    if (!analysis || analysis.userId !== userId) {
      throw new Error("Análise informada não encontrada.");
    }
  }

  return prisma.jobApplication.create({
    data: {
      userId,
      company: input.company,
      role: input.role,
      status: input.status ?? "applied",
      jobUrl: input.jobUrl,
      notes: input.notes,
      analysisId: input.analysisId,
      recruiterContactedAt: input.recruiterContactedAt ?? null,
      ...(input.appliedAt ? { appliedAt: input.appliedAt } : {}),
    },
  });
}

export async function updateJobApplication(
  id: string,
  userId: string,
  input: UpdateJobApplicationInput
) {
  const owned = await getOwnedJobApplication(id, userId);
  if (!owned) return null;

  if (input.analysisId) {
    const analysis = await prisma.analysis.findUnique({
      where: { id: input.analysisId },
      select: { userId: true },
    });
    if (!analysis || analysis.userId !== userId) {
      throw new Error("Análise informada não encontrada.");
    }
  }

  return prisma.jobApplication.update({
    where: { id },
    data: input,
  });
}

export async function deleteJobApplication(id: string, userId: string) {
  const owned = await getOwnedJobApplication(id, userId);
  if (!owned) return null;

  await prisma.jobApplication.delete({ where: { id } });
  return true;
}
