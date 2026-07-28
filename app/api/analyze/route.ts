import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { extractTextFromFile } from "@/lib/extract-text";
import { analyzeCompatibility, toPreview } from "@/lib/gemini";
import { saveAnalysis } from "@/lib/analysis-store";
import { saveAnalysisForUser } from "@/lib/analysis-repository";
import { buildApplicationChecklist } from "@/lib/application-checklist";

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
  const reusedResumeText = formData.get("resumeText");
  const jobDescription = formData.get("jobDescription");

  if (!(resume instanceof File) && typeof reusedResumeText !== "string") {
    return NextResponse.json(
      {
        error:
          "Envie um arquivo de currículo (PDF ou DOCX) ou reutilize um currículo salvo.",
      },
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

  if (resume instanceof File) {
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
  }

  try {
    const resumeText =
      resume instanceof File
        ? await extractTextFromFile(Buffer.from(await resume.arrayBuffer()), resume.name)
        : (reusedResumeText as string).trim();

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
      const checklist = buildApplicationChecklist(
        result.applicationChecklist,
        result.keywordsMissing,
        false
      );
      return NextResponse.json({ result, analysisId: analysis.id, checklist });
    }

    const analysisId = await saveAnalysis(result, resumeText, jobDescription);
    return NextResponse.json({ analysisId, preview: toPreview(result) });
  } catch (error) {
    console.error("Erro ao analisar currículo:", error);
    const message =
      error instanceof Error ? error.message : "Erro inesperado ao processar a análise.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
