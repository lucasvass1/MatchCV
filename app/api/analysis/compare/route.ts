import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOwnedAnalysis } from "@/lib/analysis-repository";
import { compareAnalysisVersions } from "@/lib/analysis-comparison";

export const runtime = "nodejs";

// Protegido também pelo middleware (matcher "/api/analysis/:path*"); a
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

  const { previousId, currentId } = (body ?? {}) as Record<string, unknown>;

  if (typeof previousId !== "string" || typeof currentId !== "string") {
    return NextResponse.json(
      { error: "Selecione as duas análises para comparar." },
      { status: 400 }
    );
  }
  if (previousId === currentId) {
    return NextResponse.json(
      { error: "Selecione duas análises diferentes." },
      { status: 400 }
    );
  }

  const [previous, current] = await Promise.all([
    getOwnedAnalysis(previousId, session.user.id),
    getOwnedAnalysis(currentId, session.user.id),
  ]);

  if (!previous || !current) {
    return NextResponse.json({ error: "Análise não encontrada." }, { status: 404 });
  }

  try {
    const comparison = await compareAnalysisVersions(previous, current);
    return NextResponse.json({ comparison });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 500 }
    );
  }
}
