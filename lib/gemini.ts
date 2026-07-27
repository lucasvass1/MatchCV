import { ApiError, GoogleGenAI, Type } from "@google/genai";

const MODEL = "gemini-flash-latest";

export type AnalysisResult = {
  score: number;
  summary: string;
  keywordsMatched: string[];
  keywordsMissing: string[];
  strengths: string[];
  weaknesses: string[];
};

// Subconjunto seguro para exibir a usuários não autenticados: nenhum campo
// que revele a análise completa (explicação, lacunas, pontos fracos) sai do
// servidor antes do login.
export type AnalysisPreview = {
  score: number;
  keywordsMatchedPreview: string[];
};

export function toPreview(result: AnalysisResult): AnalysisPreview {
  return {
    score: result.score,
    keywordsMatchedPreview: result.keywordsMatched.slice(0, 3),
  };
}

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    score: {
      type: Type.NUMBER,
      description: "Score de compatibilidade entre o currículo e a vaga, de 0 a 100.",
    },
    summary: {
      type: Type.STRING,
      description:
        "Explicação textual e objetiva do score, citando os principais motivos.",
    },
    keywordsMatched: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Palavras-chave da vaga que estão presentes no currículo.",
    },
    keywordsMissing: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Palavras-chave importantes da vaga ausentes no currículo.",
    },
    strengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Pontos fortes do currículo em relação à vaga.",
    },
    weaknesses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Pontos fracos ou lacunas do currículo em relação à vaga.",
    },
  },
  required: [
    "score",
    "summary",
    "keywordsMatched",
    "keywordsMissing",
    "strengths",
    "weaknesses",
  ],
};

export async function analyzeCompatibility(
  resumeText: string,
  jobDescription: string
): Promise<AnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não configurada no servidor.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Você é um especialista em recrutamento e seleção. Compare o currículo e a vaga abaixo e avalie a compatibilidade entre eles.

Regras:
- Não invente informações que não estão no currículo.
- Considere sinônimos e tecnologias relacionadas ao comparar palavras-chave.
- Seja específico e objetivo na explicação do score.

Currículo:
"""
${resumeText}
"""

Vaga:
"""
${jobDescription}
"""`;

  let response;
  try {
    response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema,
      },
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 429) {
      throw new Error(
        "Limite de uso do Gemini atingido no momento. Tente novamente em alguns minutos."
      );
    }
    console.error("Erro na chamada ao Gemini:", error);
    throw new Error(
      "Não foi possível concluir a análise com a IA no momento. Tente novamente."
    );
  }

  const text = response.text;
  if (!text) {
    throw new Error("O Gemini retornou uma resposta vazia.");
  }

  const parsed = JSON.parse(text) as AnalysisResult;

  return {
    ...parsed,
    score: Math.max(0, Math.min(100, Math.round(parsed.score))),
  };
}
