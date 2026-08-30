import { Question, QuestionStatus } from "./types";

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function getStatusColor(status: QuestionStatus): string {
  switch (status) {
    case "answered": return "text-green-600";
    case "unanswered": return "text-gray-400";
    case "needs_review": return "text-amber-500";
  }
}

export function getStatusLabel(status: QuestionStatus): string {
  switch (status) {
    case "answered": return "Answered";
    case "unanswered": return "Not answered";
    case "needs_review": return "Needs review";
  }
}

export function getScoreColor(earned: number, total: number): string {
  const ratio = earned / total;
  if (ratio >= 1) return "text-green-600 bg-green-50";
  if (ratio >= 0.5) return "text-amber-600 bg-amber-50";
  return "text-red-500 bg-red-50";
}

export function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.9) return "High";
  if (confidence >= 0.7) return "Medium";
  return "Low";
}

export function normalizedToPixels(
  norm: number,
  containerPx: number
): number {
  return norm * containerPx;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}
