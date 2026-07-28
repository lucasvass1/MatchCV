import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOwnedAnalysis, saveAdaptedResume } from "@/lib/analysis-repository";
import { generateAdaptedResume, type AdaptedResume } from "@/lib/gemini";
import { buildAdaptedResumeDocx } from "@/lib/generate-resume-docx";

export const runtime = "nodejs";

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
    let adaptedResume = analysis.adaptedResume as AdaptedResume | null;
    if (!adaptedResume) {
      adaptedResume = await generateAdaptedResume(
        analysis.resumeText,
        analysis.jobDescriptionText,
        {
          summary: analysis.summary,
          keywordsMissing: analysis.keywordsMissing,
          strengths: analysis.strengths,
          weaknesses: analysis.weaknesses,
        }
      );
      await saveAdaptedResume(analysis.id, adaptedResume);
    }

    const buffer = await buildAdaptedResumeDocx(adaptedResume);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": 'attachment; filename="curriculo-adaptado.docx"',
      },
    });
  } catch (error) {
    console.error("Erro ao gerar currículo adaptado:", error);
    const message =
      error instanceof Error ? error.message : "Erro inesperado ao gerar o currículo adaptado.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
