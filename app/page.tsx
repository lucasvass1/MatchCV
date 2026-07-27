import { AnalysisWorkspace } from "@/components/analysis-workspace";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-16 dark:bg-black sm:py-24">
      <div className="flex w-full max-w-2xl flex-col items-center gap-3 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          MatchCV
        </h1>
        <p className="max-w-md text-lg text-muted-foreground">
          Descubra o quão compatível seu currículo é com a vaga dos sonhos —
          em segundos, com ajuda de IA.
        </p>
      </div>

      <div className="mt-10 w-full flex justify-center">
        <AnalysisWorkspace />
      </div>
    </div>
  );
}
