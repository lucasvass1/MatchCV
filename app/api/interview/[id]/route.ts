import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOwnedInterviewSession } from "@/lib/interview-repository";
import type { InterviewMessage } from "@/lib/gemini";

export const runtime = "nodejs";

// Protegido também pelo middleware (matcher "/api/interview/:path*"); a
// checagem de sessão aqui é a garantia final caso a rota seja chamada
// diretamente sem passar pelo middleware.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const interviewSession = await getOwnedInterviewSession(id, session.user.id);
  if (!interviewSession) {
    return NextResponse.json({ error: "Entrevista não encontrada." }, { status: 404 });
  }

  return NextResponse.json({
    interviewSession: {
      id: interviewSession.id,
      messages: interviewSession.messages as InterviewMessage[],
      feedback: interviewSession.feedbackSummary
        ? {
            summary: interviewSession.feedbackSummary,
            strengths: interviewSession.feedbackStrengths,
            improvementAreas: interviewSession.feedbackImprovementAreas,
            rating: interviewSession.feedbackRating,
          }
        : null,
    },
  });
}
