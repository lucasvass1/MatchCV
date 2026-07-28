import { ApiError, GoogleGenAI, Type } from "@google/genai";

const MODEL = "gemini-flash-latest";

export type InterviewQuestion = {
  question: string;
  type: "technical" | "behavioral";
};

export type RecommendationVerdict = "recommended" | "possible" | "not_recommended";

export type Recommendation = {
  verdict: RecommendationVerdict;
  reasoning: string;
};

export type AnalysisResult = {
  score: number;
  summary: string;
  keywordsMatched: string[];
  keywordsMissing: string[];
  strengths: string[];
  weaknesses: string[];
  improvementTips: string[];
  interviewTips: string[];
  interviewQuestions: InterviewQuestion[];
  studySuggestions: string[];
  recommendation: Recommendation;
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
    improvementTips: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "Dicas concretas e acionáveis de como melhorar o currículo para esta vaga, sem inventar experiência que o candidato não tem.",
    },
    interviewTips: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "Dicas de comportamento e postura para a entrevista desta vaga específica.",
    },
    interviewQuestions: {
      type: Type.ARRAY,
      description:
        "Possíveis perguntas de entrevista para esta vaga, técnicas e comportamentais.",
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          type: {
            type: Type.STRING,
            enum: ["technical", "behavioral"],
          },
        },
        required: ["question", "type"],
      },
    },
    studySuggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "Tópicos ou tecnologias que o candidato deveria estudar para se preparar melhor para esta vaga.",
    },
    recommendation: {
      type: Type.OBJECT,
      description:
        "Avaliação honesta se vale a pena o candidato se candidatar a esta vaga, considerando pontos fortes e lacunas reais.",
      properties: {
        verdict: {
          type: Type.STRING,
          enum: ["recommended", "possible", "not_recommended"],
        },
        reasoning: {
          type: Type.STRING,
          description:
            "Explicação honesta e direta do veredito, mencionando lacunas relevantes quando existirem.",
        },
      },
      required: ["verdict", "reasoning"],
    },
  },
  required: [
    "score",
    "summary",
    "keywordsMatched",
    "keywordsMissing",
    "strengths",
    "weaknesses",
    "improvementTips",
    "interviewTips",
    "interviewQuestions",
    "studySuggestions",
    "recommendation",
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

  const prompt = `Você é um especialista em recrutamento e seleção. Compare o currículo e a vaga abaixo e produza uma análise completa de compatibilidade.

Regras:
- Nunca invente informações, tecnologias ou experiências que não estão explicitamente no currículo, mesmo que isso reduza o score.
- O score e a recomendação devem refletir a realidade do currículo, não o que seria ideal para a vaga.
- Considere sinônimos e tecnologias relacionadas ao comparar palavras-chave.
- Seja específico e objetivo em todas as explicações.
- Na recomendação final, seja honesto: se as lacunas forem grandes, diga isso claramente em vez de suavizar. O objetivo é ajudar o candidato a tomar uma boa decisão, não agradá-lo.
- As dicas de melhoria do currículo devem ser sobre como apresentar melhor a experiência real do candidato (reformulação, ênfase, métricas), nunca sobre adicionar experiência inexistente.
- As perguntas de entrevista devem ser relevantes tanto para a vaga quanto para as lacunas identificadas no currículo.

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
