import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { claimAnalysis } from "@/lib/analysis-store";
import { deleteOwnedAnalysis, saveAnalysisForUser } from "@/lib/analysis-repository";
import { buildApplicationChecklist } from "@/lib/application-checklist";

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
  const claimed = claimAnalysis(id);
  if (!claimed) {
    return NextResponse.json(
      { error: "Análise não encontrada ou expirada." },
      { status: 404 }
    );
  }

  const analysis = await saveAnalysisForUser(
    session.user.id,
    claimed.resumeText,
    claimed.jobDescriptionText,
    claimed.result
  );

  const checklist = buildApplicationChecklist(
    claimed.result.applicationChecklist,
    claimed.result.keywordsMissing,
    false
  );

  return NextResponse.json({ result: claimed.result, analysisId: analysis.id, checklist });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const deleted = await deleteOwnedAnalysis(id, session.user.id);
  if (!deleted) {
    return NextResponse.json({ error: "Análise não encontrada." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
