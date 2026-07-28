import type { ApplicationChecklistSignals, ChecklistSignalQuality } from "@/lib/gemini";

export type ChecklistItemStatus = "done" | "warning" | "missing";

export type ChecklistItem = {
  id: string;
  label: string;
  status: ChecklistItemStatus;
  detail: string;
};

const QUALITY_TO_STATUS: Record<ChecklistSignalQuality, ChecklistItemStatus> = {
  strong: "done",
  needs_improvement: "warning",
  missing: "missing",
};

// Checklist sem custo extra de IA: os sinais de GitHub/LinkedIn/portfólio já
// vêm da mesma chamada da análise de compatibilidade (ver
// applicationChecklist em analyzeCompatibility), e as palavras-chave já
// vêm do resultado da análise — nenhuma chamada adicional ao Gemini aqui.
export function buildApplicationChecklist(
  applicationChecklist: ApplicationChecklistSignals,
  keywordsMissing: string[],
  adaptedResumeReady: boolean
): ChecklistItem[] {
  return [
    {
      id: "adapted-resume",
      label: "Currículo adaptado para a vaga",
      status: adaptedResumeReady ? "done" : "missing",
      detail: adaptedResumeReady
        ? "Currículo adaptado já gerado."
        : "Baixe o currículo adaptado para esta vaga antes de aplicar.",
    },
    {
      id: "github",
      label: "GitHub informado",
      status: QUALITY_TO_STATUS[applicationChecklist.github.quality],
      detail: applicationChecklist.github.message,
    },
    {
      id: "linkedin",
      label: "LinkedIn atualizado",
      status: QUALITY_TO_STATUS[applicationChecklist.linkedin.quality],
      detail: applicationChecklist.linkedin.message,
    },
    {
      id: "portfolio",
      label: "Portfólio informado",
      status: QUALITY_TO_STATUS[applicationChecklist.portfolio.quality],
      detail: applicationChecklist.portfolio.message,
    },
    {
      id: "keywords",
      label: "Palavras-chave importantes da vaga",
      status: keywordsMissing.length === 0 ? "done" : "warning",
      detail:
        keywordsMissing.length === 0
          ? "Todas as palavras-chave da vaga aparecem no currículo. Excelente aderência!"
          : `Ainda ausentes: ${keywordsMissing.join(", ")}`,
    },
  ];
}
