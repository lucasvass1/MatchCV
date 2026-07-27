import type { AnalysisResult } from "@/lib/gemini";

// Armazena resultados de análises anônimas por um curto período, permitindo
// que o usuário reivindique o resultado completo assim que fizer login, sem
// precisar refazer a chamada à IA nem expor os campos protegidos antes disso.
// Em memória por ora, pois não há modelo de Analysis persistido até a Fase 3.
const TTL_MS = 30 * 60 * 1000; // 30 minutos

type StoreEntry = {
  result: AnalysisResult;
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

export function saveAnalysis(result: AnalysisResult): string {
  purgeExpired();
  const id = crypto.randomUUID();
  store.set(id, { result, createdAt: Date.now() });
  return id;
}

export function claimAnalysis(id: string): AnalysisResult | null {
  purgeExpired();
  const entry = store.get(id);
  if (!entry) return null;
  store.delete(id); // uso único
  return entry.result;
}
