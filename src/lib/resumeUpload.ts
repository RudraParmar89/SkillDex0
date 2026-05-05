import * as pdfjsLib from "pdfjs-dist";

// Use the bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

const MAX_ANALYSIS_CHARS = 8000;
const MAX_STORAGE_CHARS = 5000;
const UNSUPPORTED_JSON_TEXT_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;

export interface ResumePayload {
  analysisText: string;
  storageText: string;
  canAnalyze: boolean;
}

const sanitizeResumeText = (value: string) =>
  value
    .replace(UNSUPPORTED_JSON_TEXT_CHARS, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const isPdf = (file: File) => {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
};

const isPlainTextResume = (file: File) => {
  const fileName = file.name.toLowerCase();
  return file.type === "text/plain" || fileName.endsWith(".txt");
};

const buildStoredFileSummary = (file: File) => {
  const sizeInKb = Math.max(1, Math.round(file.size / 1024));
  return `Resume uploaded: ${file.name} (${file.type || "unknown type"}, ${sizeInKb} KB)`;
};

export async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item: any) => item.str)
      .join(" ");
    pages.push(text);
  }
  return pages.join("\n\n");
}

export async function extractResumePayload(file: File): Promise<ResumePayload> {
  let rawText = "";

  if (isPlainTextResume(file)) {
    rawText = await file.text();
  } else if (isPdf(file)) {
    try {
      rawText = await extractPdfText(file);
    } catch (e) {
      console.error("PDF extraction failed:", e);
    }
  }

  const sanitizedText = sanitizeResumeText(rawText);

  if (!sanitizedText) {
    const fallbackText = buildStoredFileSummary(file);
    return {
      analysisText: "",
      storageText: fallbackText.slice(0, MAX_STORAGE_CHARS),
      canAnalyze: false,
    };
  }

  return {
    analysisText: sanitizedText.slice(0, MAX_ANALYSIS_CHARS),
    storageText: sanitizedText.slice(0, MAX_STORAGE_CHARS),
    canAnalyze: true,
  };
}
