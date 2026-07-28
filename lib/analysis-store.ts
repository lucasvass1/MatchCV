import type { AnalysisResult } from "@/lib/gemini";

// Armazena resultados de análises anônimas por um curto período, permitindo
// que o usuário reivindique o resultado completo assim que fizer login, sem
// precisar refazer a chamada à IA nem expor os campos protegidos antes disso.
// Em memória por ora — uso único e curto (30min), então não precisa de tabela.
const TTL_MS = 30 * 60 * 1000; // 30 minutos

export type ClaimedAnalysis = {
  result: AnalysisResult;
  resumeText: string;
  jobDescriptionText: string;
};

type StoreEntry = ClaimedAnalysis & {
  createdAt: number;
};

const store = new Map<string, StoreEntry>();

function purgeExpired() {
  const now = Date.now();
  for (const [id, entry] of store) {
    if (now - entry.createdAt > TTL_MS) {
      store.delete(id);
    }
  }
}

export function saveAnalysis(
  result: AnalysisResult,
  resumeText: string,
  jobDescriptionText: string
): string {
  purgeExpired();
  const id = crypto.randomUUID();
  store.set(id, { result, resumeText, jobDescriptionText, createdAt: Date.now() });
  return id;
}

export function claimAnalysis(id: string): ClaimedAnalysis | null {
  purgeExpired();
  const entry = store.get(id);
  if (!entry) return null;
  store.delete(id); // uso único
  const { result, resumeText, jobDescriptionText } = entry;
  return { result, resumeText, jobDescriptionText };
}
