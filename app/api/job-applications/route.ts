import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  createJobApplication,
  listJobApplicationsForUser,
} from "@/lib/job-application-repository";
import { isApplicationStatus } from "@/lib/job-application";

export const runtime = "nodejs";

// Protegido também pelo middleware (matcher "/api/job-applications/:path*");
// a checagem de sessão aqui é a garantia final caso a rota seja chamada
// diretamente sem passar pelo middleware.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const jobApplications = await listJobApplicationsForUser(session.user.id);
  return NextResponse.json({ jobApplications });
}

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

  const { company, role, status, jobUrl, notes, analysisId } = (body ?? {}) as Record<
    string,
    unknown
  >;

  if (typeof company !== "string" || !company.trim()) {
    return NextResponse.json({ error: "Informe a empresa." }, { status: 400 });
  }
  if (typeof role !== "string" || !role.trim()) {
    return NextResponse.json({ error: "Informe o cargo." }, { status: 400 });
  }
  if (status !== undefined && (typeof status !== "string" || !isApplicationStatus(status))) {
    return NextResponse.json({ error: "Status inválido." }, { status: 400 });
  }
  if (jobUrl !== undefined && jobUrl !== null && typeof jobUrl !== "string") {
    return NextResponse.json({ error: "Link da vaga inválido." }, { status: 400 });
  }
  if (notes !== undefined && notes !== null && typeof notes !== "string") {
    return NextResponse.json({ error: "Notas inválidas." }, { status: 400 });
  }
  if (analysisId !== undefined && analysisId !== null && typeof analysisId !== "string") {
    return NextResponse.json({ error: "Currículo vinculado inválido." }, { status: 400 });
  }

  try {
    const jobApplication = await createJobApplication(session.user.id, {
      company: company.trim(),
      role: role.trim(),
      status,
      jobUrl: typeof jobUrl === "string" ? jobUrl.trim() || null : null,
      notes: typeof notes === "string" ? notes.trim() || null : null,
      analysisId: typeof analysisId === "string" ? analysisId : null,
    });
    return NextResponse.json({ jobApplication }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 400 }
    );
  }
}
