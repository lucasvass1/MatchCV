import { Document, HeadingLevel, Packer, Paragraph } from "docx";
import type { AdaptedResume } from "@/lib/gemini";

export async function buildAdaptedResumeDocx(resume: AdaptedResume): Promise<Buffer> {
  const children: Paragraph[] = [
    new Paragraph({ text: resume.fullName, heading: HeadingLevel.TITLE }),
    new Paragraph({ text: resume.headline, spacing: { after: 200 } }),
    new Paragraph({ text: "Resumo", heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ text: resume.summary, spacing: { after: 200 } }),
  ];

  for (const section of resume.sections) {
    children.push(new Paragraph({ text: section.title, heading: HeadingLevel.HEADING_1 }));

    for (const item of section.items) {
      if (item.heading) {
        children.push(new Paragraph({ text: item.heading, heading: HeadingLevel.HEADING_2 }));
      }
      for (const bullet of item.bullets) {
        children.push(new Paragraph({ text: bullet, bullet: { level: 0 } }));
      }
    }
  }

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}
