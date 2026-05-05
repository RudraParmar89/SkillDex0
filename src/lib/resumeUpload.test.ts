import { describe, expect, it } from "vitest";

import { extractResumePayload } from "./resumeUpload";

describe("extractResumePayload", () => {
  it("sanitizes text resumes before submission", async () => {
    const file = new File(["Hello\u0000\n\n\nWorld"], "resume.txt", { type: "text/plain" });

    const result = await extractResumePayload(file);

    expect(result.canAnalyze).toBe(true);
    expect(result.analysisText).toBe("Hello\n\nWorld");
    expect(result.storageText).not.toContain("\u0000");
  });

  it("avoids parsing binary resumes as text", async () => {
    const file = new File([new Uint8Array([37, 80, 68, 70, 0, 255])], "resume.pdf", {
      type: "application/pdf",
    });

    const result = await extractResumePayload(file);

    expect(result.canAnalyze).toBe(false);
    expect(result.analysisText).toBe("");
    expect(result.storageText).toContain("resume.pdf");
  });
});