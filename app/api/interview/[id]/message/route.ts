import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOwnedInterviewSession, appendInterviewMessages } from "@/lib/interview-repository";
import { generateInterviewTurn, type InterviewMessage } from "@/lib/gemini";

export const runtime = "nodejs";

// Protegido também pelo middleware (matcher "/api/interview/:path*"); a
// checagem de sessão aqui é a garantia final caso a rota seja chamada
// diretamente sem passar pelo middleware.
export async function POST(
  request: Request,
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
    return NextResponse.json({ error: "Esta entrevista já foi encerrada." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { content } = (body ?? {}) as Record<string, unknown>;
  if (typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "Digite sua resposta." }, { status: 400 });
  }

  const history = interviewSession.messages as InterviewMessage[];
  const updatedHistory: InterviewMessage[] = [
    ...history,
    { role: "user", content: content.trim() },
  ];

  try {
    const turn = await generateInterviewTurn(
      {
        resumeText: interviewSession.resumeText,
        jobDescriptionText: interviewSession.jobDescriptionText,
        strengths: interviewSession.strengths,
        weaknesses: interviewSession.weaknesses,
      },
      updatedHistory
    );

    const finalHistory: InterviewMessage[] = [
      ...updatedHistory,
      { role: "model", content: turn.message },
    ];

    await appendInterviewMessages(id, finalHistory);

    return NextResponse.json({
      messages: finalHistory,
      isFinalQuestion: turn.isFinalQuestion,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 500 }
    );
  }
}
