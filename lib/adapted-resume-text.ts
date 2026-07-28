import type { AdaptedResume } from "@/lib/gemini";

// Achata o currículo adaptado (estruturado) em texto simples, no mesmo
// formato de um currículo colado/extraído — permite reutilizá-lo como ponto
// de partida de uma nova análise sem precisar re-upload de arquivo.
export function adaptedResumeToPlainText(resume: AdaptedResume): string {
  const lines: string[] = [resume.fullName, resume.headline, "", resume.summary];

  for (const section of resume.sections) {
    lines.push("", section.title);
    for (const item of section.items) {
      if (item.heading) lines.push(item.heading);
      for (const bullet of item.bullets) lines.push(`- ${bullet}`);
    }
  }

  return lines.join("\n");
}
