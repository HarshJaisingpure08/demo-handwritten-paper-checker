// TypeScript types matching backend Pydantic schemas

export type QuestionStatus = "answered" | "unanswered" | "needs_review";

export interface AnswerRegion {
  page: number; // 1-indexed
  x: number;    // 0-1 normalized
  y: number;    // 0-1 normalized
  width: number;
  height: number;
}

export interface Question {
  id: string;
  number: string;
  text: string;
  order: number;
  status: QuestionStatus;
  answer_ids: string[];
  total_marks?: number | null;
  earned_marks?: number | null;
  feedback?: string | null;
}

export interface Answer {
  id: string;
  question_id?: string | null;
  question_number?: string | null;
  text: string;
  confidence: number;
  regions: AnswerRegion[];
  is_unmatched: boolean;
}

export interface AssessmentSummary {
  total_questions: number;
  answered: number;
  unanswered: number;
  needs_review: number;
  unmatched_answers: number;
  total_marks?: number | null;
  earned_marks?: number | null;
}

export interface AssessmentResult {
  provider: string;
  fallback_used: boolean;
  questions: Question[];
  answers: Answer[];
  unmatched_answers: Answer[];
  summary: AssessmentSummary;
  answer_sheet_page_count: number;
}

export type ProcessingStage =
  | "uploading"
  | "extracting_questions"
  | "reading_answers"
  | "mapping_answers"
  | "preparing_results";

export type AppState = "upload" | "processing" | "results";

export interface UploadedFile {
  file: File;
  name: string;
  sizeMb: number;
}
