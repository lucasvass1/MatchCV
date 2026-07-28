import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const MIN_PASSWORD_LENGTH = 8;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { name, email, password, confirmPassword } = (body ?? {}) as Record<
    string,
    unknown
  >;

  if (typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json(
      { error: "Informe um e-mail válido." },
      { status: 400 }
    );
  }

  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `A senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres.` },
      { status: 400 }
    );
  }

  if (password !== confirmPassword) {
    return NextResponse.json(
      { error: "As senhas não coincidem." },
      { status: 400 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existingUser) {
    return NextResponse.json(
      { error: "Já existe uma conta com este e-mail." },
      { status: 409 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: typeof name === "string" && name.trim() ? name.trim() : null,
        password: hashedPassword,
      },
    });
  } catch (error) {
    // Corrida de e-mail duplicado (violação da constraint unique) ou falha
    // do banco — responde de forma amigável em vez de estourar um 500 cru.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Já existe uma conta com este e-mail." },
        { status: 409 }
      );
    }
    console.error("Erro ao criar conta:", error);
    return NextResponse.json(
      { error: "Não foi possível criar sua conta agora. Tente novamente." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
