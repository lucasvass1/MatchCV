import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOwnedAnalysis, getOrGenerateAdaptedResume } from "@/lib/analysis-repository";
import { adaptedResumeToPlainText } from "@/lib/adapted-resume-text";

export const runtime = "nodejs";

// Protegido também pelo middleware (matcher "/api/analysis/:path*"); a
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
  const analysis = await getOwnedAnalysis(id, session.user.id);
  if (!analysis) {
    return NextResponse.json({ error: "Análise não encontrada." }, { status: 404 });
  }

  try {
    const adaptedResume = await getOrGenerateAdaptedResume(analysis);
    return NextResponse.json({
      resumeText: adaptedResumeToPlainText(adaptedResume),
      score: analysis.score,
      jobDescriptionText: analysis.jobDescriptionText,
      createdAt: analysis.createdAt,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 500 }
    );
  }
}
