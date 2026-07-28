import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { extractTextFromFile } from "@/lib/extract-text";
import { analyzeCompatibility, toPreview } from "@/lib/gemini";
import { saveAnalysis } from "@/lib/analysis-store";
import { saveAnalysisForUser } from "@/lib/analysis-repository";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTENSIONS = [".pdf", ".docx"];
const MIN_JOB_DESCRIPTION_LENGTH = 50;

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Não foi possível ler os dados enviados." },
      { status: 400 }
    );
  }

  const resume = formData.get("resume");
  const jobDescription = formData.get("jobDescription");

  if (!(resume instanceof File)) {
    return NextResponse.json(
      { error: "Envie um arquivo de currículo (PDF ou DOCX)." },
      { status: 400 }
    );
  }

  if (typeof jobDescription !== "string" || jobDescription.trim().length < MIN_JOB_DESCRIPTION_LENGTH) {
    return NextResponse.json(
      {
        error: `Cole a descrição completa da vaga (mínimo ${MIN_JOB_DESCRIPTION_LENGTH} caracteres).`,
      },
      { status: 400 }
    );
  }

  const hasAllowedExtension = ALLOWED_EXTENSIONS.some((ext) =>
    resume.name.toLowerCase().endsWith(ext)
  );
  if (!hasAllowedExtension) {
    return NextResponse.json(
      { error: "Formato de arquivo não suportado. Envie um PDF ou DOCX." },
      { status: 400 }
    );
  }

  if (resume.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "O arquivo do currículo deve ter no máximo 5MB." },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await resume.arrayBuffer());
    const resumeText = await extractTextFromFile(buffer, resume.name);

    if (resumeText.length < 50) {
      return NextResponse.json(
        {
          error:
            "Não foi possível extrair texto suficiente do currículo enviado.",
        },
        { status: 400 }
      );
    }

    const result = await analyzeCompatibility(resumeText, jobDescription);

    const session = await auth();
    if (session?.user?.id) {
      const analysis = await saveAnalysisForUser(
        session.user.id,
        resumeText,
        jobDescription,
        result
      );
      return NextResponse.json({ result, analysisId: analysis.id });
    }

    const analysisId = saveAnalysis(result, resumeText, jobDescription);
    return NextResponse.json({ analysisId, preview: toPreview(result) });
  } catch (error) {
    console.error("Erro ao analisar currículo:", error);
    const message =
      error instanceof Error ? error.message : "Erro inesperado ao processar a análise.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
