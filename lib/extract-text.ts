import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export async function extractTextFromFile(
  buffer: Buffer,
  fileName: string
): Promise<string> {
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".pdf")) {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text.trim();
    } finally {
      await parser.destroy();
    }
  }

  if (lower.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  throw new Error(
    "Formato de arquivo não suportado. Envie um currículo em PDF ou DOCX."
  );
}
