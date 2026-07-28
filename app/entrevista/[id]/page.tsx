import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOwnedInterviewSession } from "@/lib/interview-repository";
import { InterviewChat } from "@/components/interview/interview-chat";
import type { InterviewMessage } from "@/lib/gemini";

export default async function EntrevistaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // A rota já é protegida pelo proxy (ver proxy.ts); a sessão aqui só
  // popula os dados iniciais do usuário autenticado.
  const session = await auth();
  const userId = session!.user!.id!;

  const { id } = await params;
  const interviewSession = await getOwnedInterviewSession(id, userId);
  if (!interviewSession) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-10 dark:bg-black sm:px-8">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Simulação de entrevista</h1>
          <p className="text-sm text-muted-foreground">
            Responda como faria em uma entrevista real. Ao final, você recebe um
            feedback honesto sobre seu desempenho.
          </p>
        </div>

        <InterviewChat
          interviewId={interviewSession.id}
          initialMessages={interviewSession.messages as InterviewMessage[]}
          initialFeedback={
            interviewSession.feedbackSummary
              ? {
                  summary: interviewSession.feedbackSummary,
                  strengths: interviewSession.feedbackStrengths,
                  improvementAreas: interviewSession.feedbackImprovementAreas,
                  rating: interviewSession.feedbackRating as "strong" | "average" | "weak",
                }
              : null
          }
        />
      </div>
    </div>
  );
}
