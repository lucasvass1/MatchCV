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

type GeminiContent = { role: "user" | "model"; parts: { text: string }[] };

async function callGemini(
  contents: string | GeminiContent[],
  schema: object,
  systemInstruction?: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não configurada no servidor.");
  }

  const ai = new GoogleGenAI({ apiKey });

  let response;
  try {
    response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        ...(systemInstruction ? { systemInstruction } : {}),
        responseMimeType: "application/json",
        responseSchema: schema,
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
      "Não foi possível concluir a operação com a IA no momento. Tente novamente."
    );
  }

  const text = response.text;
  if (!text) {
    throw new Error("O Gemini retornou uma resposta vazia.");
  }
  return text;
}

export async function analyzeCompatibility(
  resumeText: string,
  jobDescription: string
): Promise<AnalysisResult> {
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

  const text = await callGemini(prompt, responseSchema);
  const parsed = JSON.parse(text) as AnalysisResult;

  return {
    ...parsed,
    score: Math.max(0, Math.min(100, Math.round(parsed.score))),
  };
}

export type AdaptedResumeSection = {
  title: string;
  items: {
    heading?: string;
    bullets: string[];
  }[];
};

export type AdaptedResume = {
  fullName: string;
  headline: string;
  summary: string;
  sections: AdaptedResumeSection[];
};

const adaptedResumeSchema = {
  type: Type.OBJECT,
  properties: {
    fullName: {
      type: Type.STRING,
      description: "Nome completo do candidato, extraído do currículo original.",
    },
    headline: {
      type: Type.STRING,
      description:
        "Linha de destaque logo abaixo do nome (cargo-alvo e principais tecnologias), alinhada à vaga.",
    },
    summary: {
      type: Type.STRING,
      description:
        "Resumo profissional de 2-4 frases, reescrito para destacar a aderência real à vaga.",
    },
    sections: {
      type: Type.ARRAY,
      description:
        "Seções do currículo (ex: Experiência Profissional, Formação Acadêmica, Habilidades Técnicas, Certificações), na ordem em que devem aparecer.",
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                heading: {
                  type: Type.STRING,
                  description:
                    "Ex: 'Desenvolvedor Backend — Empresa X (2021-2024)'. Omitir para seções sem subitens (ex: lista simples de habilidades).",
                },
                bullets: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ["bullets"],
            },
          },
        },
        required: ["title", "items"],
      },
    },
  },
  required: ["fullName", "headline", "summary", "sections"],
};

export type AdaptedResumeContext = {
  summary: string;
  keywordsMissing: string[];
  strengths: string[];
  weaknesses: string[];
};

export async function generateAdaptedResume(
  resumeText: string,
  jobDescription: string,
  analysis: AdaptedResumeContext
): Promise<AdaptedResume> {
  const prompt = `Você é um especialista em recrutamento. Reescreva o currículo abaixo para maximizar sua aderência à vaga, com base na análise de compatibilidade já feita.

Regras:
- Nunca invente cargos, empresas, tecnologias, certificações ou datas que não estejam no currículo original.
- Você pode e deve incorporar palavras-chave ausentes SOMENTE quando forem sinônimos ou formas mais adequadas de descrever experiência que o candidato genuinamente já tem.
- Reorganize e reescreva frases para usar verbos de ação, métricas e resultados quando presentes no original.
- Mantenha todas as seções relevantes do currículo original (experiência, formação, habilidades, etc.), na ordem que fizer mais sentido para esta vaga.
- Use um tom profissional, direto e objetivo, sem floreios.

Análise de compatibilidade já realizada:
- Resumo: ${analysis.summary}
- Palavras-chave ausentes: ${analysis.keywordsMissing.join(", ") || "nenhuma"}
- Pontos fortes: ${analysis.strengths.join("; ")}
- Pontos fracos: ${analysis.weaknesses.join("; ")}

Currículo original:
"""
${resumeText}
"""

Vaga:
"""
${jobDescription}
"""`;

  const text = await callGemini(prompt, adaptedResumeSchema);
  return JSON.parse(text) as AdaptedResume;
}

export type ComparisonSnapshot = {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
};

export type ComparisonKeywordDiff = {
  newlyMatched: string[];
  resolvedGaps: string[];
  newGaps: string[];
  stillMissing: string[];
};

export type ComparisonInsight = {
  summary: string;
  keyChanges: string[];
};

const comparisonSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description:
        "Resumo objetivo, em 2-4 frases, da evolução entre as duas análises, citando os principais fatores que explicam a diferença de score.",
    },
    keyChanges: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "Lista das mudanças específicas (novas palavras-chave, pontos fortes ganhos/perdidos, lacunas resolvidas ou surgidas) que mais contribuíram para a diferença de score.",
    },
  },
  required: ["summary", "keyChanges"],
};

export async function compareAnalyses(
  previous: ComparisonSnapshot,
  current: ComparisonSnapshot,
  keywordDiff: ComparisonKeywordDiff
): Promise<ComparisonInsight> {
  const scoreDelta = current.score - previous.score;

  const prompt = `Você é um especialista em recrutamento. Compare duas análises de compatibilidade feitas para o mesmo candidato em momentos diferentes e explique objetivamente o que mudou entre elas.

Regras:
- Baseie-se apenas nos dados fornecidos abaixo, não invente mudanças que não estão listadas.
- Seja específico: cite palavras-chave, pontos fortes ou fracos concretos, nunca frases vagas como "o currículo melhorou".
- Se o score caiu ou ficou igual, explique isso honestamente, sem suavizar.

Análise anterior (score ${previous.score}):
- Resumo: ${previous.summary}
- Pontos fortes: ${previous.strengths.join("; ") || "nenhum"}
- Pontos fracos: ${previous.weaknesses.join("; ") || "nenhum"}

Análise atual (score ${current.score}, variação de ${scoreDelta >= 0 ? "+" : ""}${scoreDelta} pontos):
- Resumo: ${current.summary}
- Pontos fortes: ${current.strengths.join("; ") || "nenhum"}
- Pontos fracos: ${current.weaknesses.join("; ") || "nenhum"}

Diferenças já identificadas nas palavras-chave entre as duas análises:
- Novas palavras-chave presentes agora: ${keywordDiff.newlyMatched.join(", ") || "nenhuma"}
- Lacunas resolvidas (antes ausentes, agora presentes): ${keywordDiff.resolvedGaps.join(", ") || "nenhuma"}
- Novas lacunas (não apareciam antes): ${keywordDiff.newGaps.join(", ") || "nenhuma"}
- Lacunas que continuam ausentes: ${keywordDiff.stillMissing.join(", ") || "nenhuma"}`;

  const text = await callGemini(prompt, comparisonSchema);
  return JSON.parse(text) as ComparisonInsight;
}

export type InterviewMessageRole = "user" | "model";

export type InterviewMessage = {
  role: InterviewMessageRole;
  content: string;
};

export type InterviewContext = {
  resumeText: string;
  jobDescriptionText: string;
  strengths: string[];
  weaknesses: string[];
};

export type InterviewTurn = {
  message: string;
  isFinalQuestion: boolean;
};

const interviewTurnSchema = {
  type: Type.OBJECT,
  properties: {
    message: {
      type: Type.STRING,
      description:
        "Próxima pergunta (ou breve reação à resposta anterior seguida de uma nova pergunta) do entrevistador para o candidato, em português.",
    },
    isFinalQuestion: {
      type: Type.BOOLEAN,
      description:
        "true somente se esta for a última pergunta da entrevista, após cobrir bem tanto aspectos técnicos quanto comportamentais (normalmente entre 5 e 7 perguntas no total).",
    },
  },
  required: ["message", "isFinalQuestion"],
};

function buildInterviewSystemInstruction(context: InterviewContext): string {
  return `Você é um entrevistador de RH experiente, conduzindo uma simulação de entrevista de emprego em português para a vaga abaixo, considerando o currículo do candidato e a análise de compatibilidade já feita.

Regras:
- Faça UMA pergunta por vez, nunca várias de uma vez.
- Alterne entre perguntas técnicas (relacionadas às tecnologias e requisitos da vaga) e perguntas comportamentais.
- Priorize investigar as lacunas identificadas (${context.weaknesses.join("; ") || "nenhuma lacuna relevante"}) e validar os pontos fortes (${context.strengths.join("; ") || "nenhum ponto forte relevante"}).
- Antes da próxima pergunta, reaja em uma frase curta à resposta anterior do candidato, mas nunca avalie, corrija ou dê a resposta certa durante a entrevista — a avaliação final acontece só depois, em um feedback separado.
- Depois de cobrir bem o técnico e o comportamental (normalmente entre 5 e 7 perguntas), marque isFinalQuestion como true na pergunta que encerra a entrevista.
- Nunca saia do personagem de entrevistador.

Vaga:
"""
${context.jobDescriptionText}
"""

Currículo do candidato:
"""
${context.resumeText}
"""`;
}

export async function generateInterviewTurn(
  context: InterviewContext,
  history: InterviewMessage[]
): Promise<InterviewTurn> {
  const seed: InterviewMessage[] =
    history.length > 0
      ? history
      : [{ role: "user", content: "Vamos começar a entrevista. Faça a primeira pergunta." }];

  const contents: GeminiContent[] = seed.map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));

  const text = await callGemini(
    contents,
    interviewTurnSchema,
    buildInterviewSystemInstruction(context)
  );
  return JSON.parse(text) as InterviewTurn;
}

export type InterviewRating = "strong" | "average" | "weak";

export type InterviewFeedback = {
  summary: string;
  strengths: string[];
  improvementAreas: string[];
  rating: InterviewRating;
};

const interviewFeedbackSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "Resumo objetivo do desempenho do candidato na entrevista simulada.",
    },
    strengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Pontos fortes demonstrados nas respostas do candidato, com exemplos concretos.",
    },
    improvementAreas: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "Pontos a melhorar nas respostas, com sugestões concretas e acionáveis (não genéricas).",
    },
    rating: {
      type: Type.STRING,
      enum: ["strong", "average", "weak"],
      description: "Avaliação geral honesta do desempenho na entrevista.",
    },
  },
  required: ["summary", "strengths", "improvementAreas", "rating"],
};

export async function generateInterviewFeedback(
  context: InterviewContext,
  history: InterviewMessage[]
): Promise<InterviewFeedback> {
  const transcript = history
    .map((m) => `${m.role === "model" ? "Entrevistador" : "Candidato"}: ${m.content}`)
    .join("\n\n");

  const prompt = `Você é um especialista em recrutamento avaliando o desempenho de um candidato em uma entrevista simulada para a vaga abaixo. Avalie com base apenas nas respostas realmente dadas na conversa, sem inventar informações.

Regras:
- Seja honesto: se as respostas foram fracas, vagas ou incompletas, diga isso claramente em vez de suavizar.
- Cite exemplos concretos das falas do candidato ao explicar pontos fortes e fracos.
- As sugestões de melhoria devem ser acionáveis (ex: "detalhe o impacto em números ao falar do projeto X", não apenas "seja mais específico").

Vaga:
"""
${context.jobDescriptionText}
"""

Transcrição da entrevista simulada:
"""
${transcript}
"""`;

  const text = await callGemini(prompt, interviewFeedbackSchema);
  return JSON.parse(text) as InterviewFeedback;
}
