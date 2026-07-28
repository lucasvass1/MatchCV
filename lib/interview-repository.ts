import { prisma } from "@/lib/prisma";
import type { InterviewContext, InterviewFeedback, InterviewMessage } from "@/lib/gemini";

export async function createInterviewSession(
  userId: string,
  analysisId: string,
  context: InterviewContext,
  messages: InterviewMessage[]
) {
  return prisma.interviewSession.create({
    data: {
      userId,
      analysisId,
      resumeText: context.resumeText,
      jobDescriptionText: context.jobDescriptionText,
      strengths: context.strengths,
      weaknesses: context.weaknesses,
      messages,
    },
  });
}

export async function getOwnedInterviewSession(id: string, userId: string) {
  const session = await prisma.interviewSession.findUnique({ where: { id } });
  if (!session || session.userId !== userId) return null;
  return session;
}

export async function listInterviewSessionsForUser(userId: string) {
  return prisma.interviewSession.findMany({
    where: { userId },
    select: { id: true, analysisId: true, feedbackSummary: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function appendInterviewMessages(id: string, messages: InterviewMessage[]) {
  return prisma.interviewSession.update({
    where: { id },
    data: { messages },
  });
}

export async function saveInterviewFeedback(id: string, feedback: InterviewFeedback) {
  return prisma.interviewSession.update({
    where: { id },
    data: {
      feedbackSummary: feedback.summary,
      feedbackStrengths: feedback.strengths,
      feedbackImprovementAreas: feedback.improvementAreas,
      feedbackRating: feedback.rating,
    },
  });
}
