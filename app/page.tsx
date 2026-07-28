import Link from "next/link";
import { Suspense } from "react";
import {
  Sparkles,
  Upload,
  ClipboardList,
  Target,
  ArrowRight,
  Check,
  Lock,
  ShieldCheck,
  Search,
  ListChecks,
  MessageSquare,
  LayoutGrid,
  Library,
  GitCompare,
  BarChart3,
  FileDown,
  BookOpen,
  Scale,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { RegisterForm } from "@/components/auth/register-form";
import { Reveal } from "@/components/reveal";

export const metadata = {
  title: "MatchCV — Compatibilidade entre currículo e vaga com IA",
  description:
    "Envie seu currículo, cole a vaga e receba um score de compatibilidade explicado, currículo adaptado, simulador de entrevista e acompanhamento de candidaturas — com IA.",
};

export default async function LandingPage() {
  const session = await auth();
  const isAuthenticated = Boolean(session?.user);

  return (
    <div className="flex flex-1 flex-col">
      <Hero isAuthenticated={isAuthenticated} />
      <HowItWorks />
      <Features />
      <HonestyBanner />
      <GetStarted isAuthenticated={isAuthenticated} name={session?.user?.name ?? null} />
      <LandingFooter />
    </div>
  );
}

/* ---------------- HERO ---------------- */

function Hero({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section
      id="top"
      className="relative overflow-hidden bg-zinc-950 text-white"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(680px 420px at 12% 6%, rgba(139,92,246,0.28), transparent 60%), radial-gradient(720px 460px at 92% 16%, rgba(16,185,129,0.24), transparent 55%)",
        }}
      />
      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-14 px-6 py-20 sm:py-28 lg:grid-cols-[1.05fr_0.95fr]">
        <Reveal>
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-violet-200">
            <Sparkles className="size-3.5" />
            Análise de currículo com IA (Google Gemini)
          </span>
          <h1 className="text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">
            Descubra o quão{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
              compatível
            </span>{" "}
            seu currículo é com a vaga.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-zinc-300">
            Envie seu currículo e cole a descrição da vaga. O MatchCV calcula um
            score de compatibilidade explicado — não só um número — mostrando o
            que bate, o que falta e por quê.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/analisar"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/25 transition duration-150 hover:bg-emerald-400 active:scale-[0.98]"
            >
              {isAuthenticated ? "Ir para minha análise" : "Analisar meu currículo"}
              <ArrowRight className="size-4" />
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition duration-150 hover:bg-white/10 active:scale-[0.98]"
            >
              Como funciona
            </a>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-400">
            <li className="flex items-center gap-2">
              <Check className="size-4 text-emerald-400" /> Aceita PDF e DOCX
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-4 text-emerald-400" /> Prévia grátis, sem cartão
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-4 text-emerald-400" /> A IA não inventa informações
            </li>
          </ul>
        </Reveal>

        <Reveal delay={120}>
          <HeroMock />
        </Reveal>
      </div>
    </section>
  );
}

function HeroMock() {
  return (
    <div aria-hidden className="relative">
      <div
        className="absolute -inset-3 -z-10 rounded-3xl opacity-50 blur-xl"
        style={{
          background:
            "linear-gradient(160deg, rgba(139,92,246,0.35), rgba(16,185,129,0.3))",
        }}
      />
      <div className="rotate-[1.2deg] rounded-2xl bg-white p-5 text-zinc-900 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-700">
            <Sparkles className="size-3" />
            Resultado da análise
          </span>
          <span className="size-4 rounded-full border-2 border-zinc-200" />
        </div>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-sm font-semibold text-zinc-500">Compatibilidade</span>
          <span className="text-3xl font-bold">82%</span>
        </div>
        <div className="mb-4 h-2.5 overflow-hidden rounded-full bg-zinc-100">
          <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" />
        </div>
        <div className="mb-4 flex flex-wrap gap-1.5">
          <MockChip variant="match">React</MockChip>
          <MockChip variant="match">TypeScript</MockChip>
          <MockChip variant="match">Node.js</MockChip>
          <MockChip variant="missing">AWS</MockChip>
        </div>
        <div className="my-4 h-px bg-zinc-100" />
        <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="select-none text-xs leading-relaxed text-zinc-500 blur-[3px]">
            <strong>Explicação do score.</strong> Seu currículo cobre a maior parte
            dos requisitos técnicos da vaga, com forte aderência em front-end e
            experiência prática comprovada em projetos recentes...
          </p>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-white/60">
            <Lock className="size-4 text-zinc-500" />
            <span className="text-xs font-bold text-zinc-800">
              Crie sua conta para desbloquear
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockChip({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "match" | "missing";
}) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        variant === "match"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-700"
      }`}
    >
      {children}
    </span>
  );
}

/* ---------------- COMO FUNCIONA ---------------- */

const STEPS = [
  {
    icon: Upload,
    title: "Envie seu currículo",
    text: "Suba o arquivo em PDF ou DOCX. O texto é extraído automaticamente, sem precisar reescrever nada.",
  },
  {
    icon: ClipboardList,
    title: "Cole a descrição da vaga",
    text: "Copie e cole o texto completo da vaga que você quer se candidatar — de qualquer site.",
  },
  {
    icon: Target,
    title: "Receba a análise com IA",
    text: "Em segundos, veja o score explicado, palavras-chave e os pontos que mais pesam na sua candidatura.",
  },
];

function HowItWorks() {
  return (
    <section id="como-funciona" className="px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHead
            kicker="Como funciona"
            title="Três passos até a sua resposta"
            subtitle="Sem formulários longos, sem configuração. Só o essencial para uma análise honesta."
          />
        </Reveal>
        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal key={step.title} delay={i * 90}>
              <div className="relative h-full rounded-2xl border border-border bg-zinc-50 p-7 dark:bg-zinc-900/40">
                <span className="absolute right-6 top-5 text-4xl font-bold text-border">
                  0{i + 1}
                </span>
                <div className="mb-5 flex size-11 items-center justify-center rounded-xl border border-border bg-background shadow-sm">
                  <step.icon className="size-5 text-emerald-600" />
                </div>
                <h3 className="mb-2 text-lg font-semibold tracking-tight">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- RECURSOS ---------------- */

const FEATURES = [
  {
    icon: BarChart3,
    tone: "emerald" as const,
    title: "Score explicado",
    text: "Cada porcentagem vem com uma explicação textual objetiva do porquê daquele resultado.",
  },
  {
    icon: Search,
    tone: "violet" as const,
    title: "Palavras-chave da vaga",
    text: "Veja quais termos da vaga já aparecem no seu currículo — e quais estão faltando.",
  },
  {
    icon: Scale,
    tone: "amber" as const,
    title: "Recomendação honesta",
    text: "A IA avalia se realmente vale a pena se candidatar, apontando pontos fortes e lacunas reais.",
  },
  {
    icon: FileDown,
    tone: "emerald" as const,
    title: "Currículo adaptado",
    text: "Gere uma versão do seu currículo otimizada para a vaga e baixe em DOCX — sem inventar experiência.",
  },
  {
    icon: MessageSquare,
    tone: "violet" as const,
    title: "Simulador de entrevista",
    text: "Treine em um chat com um entrevistador de IA baseado na vaga e receba um feedback ao final.",
  },
  {
    icon: ListChecks,
    tone: "amber" as const,
    title: "Checklist antes de aplicar",
    text: "GitHub, LinkedIn, portfólio e palavras-chave importantes conferidos antes de você enviar.",
  },
  {
    icon: LayoutGrid,
    tone: "emerald" as const,
    title: "Painel de candidaturas",
    text: "Acompanhe cada vaga em um quadro por status: aplicado, em processo, entrevista, retorno.",
  },
  {
    icon: Library,
    tone: "violet" as const,
    title: "Biblioteca de currículos",
    text: "Todas as versões adaptadas ficam salvas, prontas para baixar ou reutilizar em uma nova análise.",
  },
  {
    icon: GitCompare,
    tone: "amber" as const,
    title: "Comparação de versões",
    text: "Veja a evolução da sua compatibilidade entre duas análises, com resumo do que mudou.",
  },
];

const TONE_CLASSES: Record<string, string> = {
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-950/40",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/40",
};

function Features() {
  return (
    <section
      id="recursos"
      className="border-y border-border bg-zinc-50 px-6 py-20 dark:bg-zinc-900/40 sm:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHead
            kicker="Recursos"
            title="Mais do que um número"
            subtitle="Da análise à candidatura: tudo o que o MatchCV já faz para te ajudar a chegar na entrevista."
          />
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 80}>
              <div className="h-full rounded-2xl border border-border bg-background p-6 transition hover:-translate-y-0.5 hover:shadow-sm">
                <div
                  className={`mb-4 flex size-10 items-center justify-center rounded-xl ${TONE_CLASSES[f.tone]}`}
                >
                  <f.icon className="size-5" />
                </div>
                <h3 className="mb-2 text-base font-semibold tracking-tight">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-6 flex flex-col gap-3 rounded-2xl border border-border bg-background p-6 sm:flex-row sm:items-center">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
            <BookOpen className="size-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold tracking-tight">
              Preparação e progresso
            </h3>
            <p className="text-sm text-muted-foreground">
              Dicas de melhoria do currículo, perguntas prováveis de entrevista, o que
              estudar para a vaga — e um painel &quot;Meu progresso&quot; com sua
              evolução de compatibilidade ao longo do tempo.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- HONESTIDADE ---------------- */

function HonestyBanner() {
  return (
    <section className="px-6 py-20 sm:py-24">
      <Reveal className="mx-auto flex max-w-6xl flex-col gap-4 rounded-2xl bg-zinc-950 p-8 text-white sm:flex-row sm:items-start sm:p-10">
        <ShieldCheck className="size-6 shrink-0 text-emerald-400" />
        <div>
          <h3 className="text-lg font-semibold">Um princípio, sem exceção</h3>
          <p className="mt-1 max-w-3xl text-sm text-zinc-300">
            A IA do MatchCV nunca inventa experiências, habilidades ou palavras-chave
            que não estão no seu currículo — mesmo que isso aumentasse o score
            artificialmente. O objetivo é uma avaliação honesta que ajude você a
            decidir, não uma nota inflada.
          </p>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------------- COMECE AGORA ---------------- */

function GetStarted({
  isAuthenticated,
  name,
}: {
  isAuthenticated: boolean;
  name: string | null;
}) {
  return (
    <section
      id="comecar"
      className="border-t border-border bg-zinc-50 px-6 py-20 dark:bg-zinc-900/40 sm:py-24"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_0.85fr]">
        <Reveal>
          <SectionHead
            align="left"
            kicker="Comece agora"
            title="Pronto para saber sua compatibilidade?"
            subtitle="Rode a análise sem criar conta e veja a prévia. Crie um login para desbloquear o resultado completo e todas as ferramentas — sua análise não se perde no caminho."
          />
          <ul className="flex flex-col gap-3 text-sm">
            {[
              "Prévia gratuita, sem cadastro e sem cartão",
              "Login com Google ou e-mail e senha",
              "A análise feita antes do login é recuperada automaticamente",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <Check className="size-4 shrink-0 text-emerald-600" />
                {item}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={120}>
        {isAuthenticated ? (
          <div className="rounded-2xl border border-border bg-background p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
              <Sparkles className="size-6" />
            </div>
            <h3 className="text-lg font-semibold">
              {name ? `Bem-vindo de volta, ${name.split(" ")[0]}!` : "Bem-vindo de volta!"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Sua conta já está pronta. Comece uma nova análise quando quiser.
            </p>
            <Link
              href="/analisar"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-950 transition duration-150 hover:bg-emerald-400 active:scale-[0.98]"
            >
              Ir para minha análise
              <ArrowRight className="size-4" />
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-background p-6 shadow-sm sm:p-8">
            <h3 className="mb-1 text-lg font-semibold">Criar conta grátis</h3>
            <p className="mb-5 text-sm text-muted-foreground">
              Já tem conta?{" "}
              <Link
                href="/login"
                className="font-medium text-foreground underline underline-offset-4"
              >
                Entrar
              </Link>
            </p>
            <Suspense fallback={null}>
              <RegisterForm />
            </Suspense>
          </div>
        )}
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- SHARED / FOOTER ---------------- */

function SectionHead({
  kicker,
  title,
  subtitle,
  align = "center",
}: {
  kicker: string;
  title: string;
  subtitle: string;
  align?: "center" | "left";
}) {
  return (
    <div
      className={`mb-12 ${
        align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-xl"
      }`}
    >
      <span className="mb-4 inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
        {kicker}
      </span>
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      <p className="mt-3 text-base text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function LandingFooter() {
  return (
    <footer className="px-6 pb-10 pt-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 border-t border-border pt-7 text-sm text-muted-foreground sm:flex-row">
        <p>
          MatchCV — projeto desenvolvido por Lucas Vasconcelos. Análise de
          compatibilidade entre currículo e vaga com IA.
        </p>
        <div className="flex gap-6">
          <a href="#como-funciona" className="hover:text-foreground">
            Como funciona
          </a>
          <a href="#recursos" className="hover:text-foreground">
            Recursos
          </a>
        </div>
      </div>
    </footer>
  );
}
