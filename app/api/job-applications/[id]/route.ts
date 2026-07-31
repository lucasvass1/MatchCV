import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  deleteJobApplication,
  updateJobApplication,
} from "@/lib/job-application-repository";
import { isApplicationStatus } from "@/lib/job-application";

export const runtime = "nodejs";

// Protegido também pelo middleware (matcher "/api/job-applications/:path*");
// a checagem de sessão aqui é a garantia final caso a rota seja chamada
// diretamente sem passar pelo middleware.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { company, role, status, jobUrl, notes, analysisId, appliedAt, recruiterContacted } =
    (body ?? {}) as Record<string, unknown>;

  const data: Parameters<typeof updateJobApplication>[2] = {};

  if (company !== undefined) {
    if (typeof company !== "string" || !company.trim()) {
      return NextResponse.json({ error: "Informe a empresa." }, { status: 400 });
    }
    data.company = company.trim();
  }
  if (role !== undefined) {
    if (typeof role !== "string" || !role.trim()) {
      return NextResponse.json({ error: "Informe o cargo." }, { status: 400 });
    }
    data.role = role.trim();
  }
  if (status !== undefined) {
    if (typeof status !== "string" || !isApplicationStatus(status)) {
      return NextResponse.json({ error: "Status inválido." }, { status: 400 });
    }
    data.status = status;
  }
  if (jobUrl !== undefined) {
    if (jobUrl !== null && typeof jobUrl !== "string") {
      return NextResponse.json({ error: "Link da vaga inválido." }, { status: 400 });
    }
    data.jobUrl = typeof jobUrl === "string" ? jobUrl.trim() || null : null;
  }
  if (notes !== undefined) {
    if (notes !== null && typeof notes !== "string") {
      return NextResponse.json({ error: "Notas inválidas." }, { status: 400 });
    }
    data.notes = typeof notes === "string" ? notes.trim() || null : null;
  }
  if (analysisId !== undefined) {
    if (analysisId !== null && typeof analysisId !== "string") {
      return NextResponse.json({ error: "Currículo vinculado inválido." }, { status: 400 });
    }
    data.analysisId = analysisId;
  }
  if (appliedAt !== undefined) {
    const parsed = typeof appliedAt === "string" ? new Date(appliedAt) : null;
    if (!parsed || Number.isNaN(parsed.getTime())) {
      return NextResponse.json({ error: "Data inválida." }, { status: 400 });
    }
    data.appliedAt = parsed;
  }
  if (recruiterContacted !== undefined) {
    if (typeof recruiterContacted !== "boolean") {
      return NextResponse.json({ error: "Valor de contato inválido." }, { status: 400 });
    }
    data.recruiterContactedAt = recruiterContacted ? new Date() : null;
  }

  const { id } = await params;

  try {
    const jobApplication = await updateJobApplication(id, session.user.id, data);
    if (!jobApplication) {
      return NextResponse.json({ error: "Candidatura não encontrada." }, { status: 404 });
    }
    return NextResponse.json({ jobApplication });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 400 }
    );
  }
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
  const deleted = await deleteJobApplication(id, session.user.id);
  if (!deleted) {
    return NextResponse.json({ error: "Candidatura não encontrada." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
