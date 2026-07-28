import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOwnedAnalysis } from "@/lib/analysis-repository";
import { createInterviewSession } from "@/lib/interview-repository";
import { generateInterviewTurn, type InterviewContext, type InterviewMessage } from "@/lib/gemini";

export const runtime = "nodejs";

// Protegido também pelo middleware (matcher "/api/interview/:path*"); a
// checagem de sessão aqui é a garantia final caso a rota seja chamada
// diretamente sem passar pelo middleware.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { analysisId } = (body ?? {}) as Record<string, unknown>;
  if (typeof analysisId !== "string" || !analysisId) {
    return NextResponse.json({ error: "Selecione a análise da vaga." }, { status: 400 });
  }

  const analysis = await getOwnedAnalysis(analysisId, session.user.id);
  if (!analysis) {
    return NextResponse.json({ error: "Análise não encontrada." }, { status: 404 });
  }

  const context: InterviewContext = {
    resumeText: analysis.resumeText,
    jobDescriptionText: analysis.jobDescriptionText,
    strengths: analysis.strengths,
    weaknesses: analysis.weaknesses,
  };

  try {
    const firstTurn = await generateInterviewTurn(context, []);
    const messages: InterviewMessage[] = [{ role: "model", content: firstTurn.message }];

    const interviewSession = await createInterviewSession(
      session.user.id,
      analysisId,
      context,
      messages
    );

    return NextResponse.json({
      interviewSession: {
        id: interviewSession.id,
        messages,
        isFinalQuestion: firstTurn.isFinalQuestion,
        feedback: null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 500 }
    );
  }
}
