import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOwnedInterviewSession, saveInterviewFeedback } from "@/lib/interview-repository";
import { generateInterviewFeedback, type InterviewMessage } from "@/lib/gemini";

export const runtime = "nodejs";

// Protegido também pelo middleware (matcher "/api/interview/:path*"); a
// checagem de sessão aqui é a garantia final caso a rota seja chamada
// diretamente sem passar pelo middleware.
export async function POST(
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

  if (interviewSession.feedbackSummary) {
    return NextResponse.json({
      feedback: {
        summary: interviewSession.feedbackSummary,
        strengths: interviewSession.feedbackStrengths,
        improvementAreas: interviewSession.feedbackImprovementAreas,
        rating: interviewSession.feedbackRating,
      },
    });
  }

  const history = interviewSession.messages as InterviewMessage[];
  const hasCandidateAnswer = history.some((m) => m.role === "user");
  if (!hasCandidateAnswer) {
    return NextResponse.json(
      { error: "Responda pelo menos uma pergunta antes de encerrar a entrevista." },
      { status: 400 }
    );
  }

  try {
    const feedback = await generateInterviewFeedback(
      {
        resumeText: interviewSession.resumeText,
        jobDescriptionText: interviewSession.jobDescriptionText,
        strengths: interviewSession.strengths,
        weaknesses: interviewSession.weaknesses,
      },
      history
    );

    await saveInterviewFeedback(id, feedback);

    return NextResponse.json({ feedback });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 500 }
    );
  }
}
