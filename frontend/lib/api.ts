// API client — never exposes API keys

import { AssessmentResult } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function processAssessment(
  questionPaper: File,
  answerSheet: File
): Promise<AssessmentResult> {
  const formData = new FormData();
  formData.append("question_paper", questionPaper);
  formData.append("answer_sheet", answerSheet);

  const response = await fetch(`${API_BASE}/api/assessment/process`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let message = "Processing failed. Please try again.";
    try {
      const err = await response.json();
      message = err.detail || message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  return response.json() as Promise<AssessmentResult>;
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}
