import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { claimAnalysis } from "@/lib/analysis-store";

export const runtime = "nodejs";

// Protegido também pelo middleware (matcher "/api/analysis/:path*"); a
// checagem de sessão aqui é a garantia final caso a rota seja chamada
// diretamente sem passar pelo middleware.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const result = claimAnalysis(id);
  if (!result) {
    return NextResponse.json(
      { error: "Análise não encontrada ou expirada." },
      { status: 404 }
    );
  }

  return NextResponse.json({ result });
}
