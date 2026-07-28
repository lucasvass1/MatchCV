import { Suspense } from "react";
import { AnalysisWorkspace } from "@/components/analysis-workspace";

export const metadata = {
  title: "Analisar currículo — MatchCV",
};

export default function AnalisarPage() {
  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-16 dark:bg-black sm:py-24">
      <div className="flex w-full max-w-2xl flex-col items-center gap-3 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Nova análise</h1>
        <p className="max-w-md text-lg text-muted-foreground">
          Envie seu currículo e cole a descrição da vaga para ver o quão
          compatível você está — em segundos, com ajuda de IA.
        </p>
      </div>

      <div className="mt-10 w-full flex justify-center">
        <Suspense>
          <AnalysisWorkspace />
        </Suspense>
      </div>
    </div>
  );
}
