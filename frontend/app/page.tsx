"use client";
import { useState, useCallback } from "react";
import { AppState, AssessmentResult, ProcessingStage, UploadedFile } from "@/lib/types";
import { processAssessment } from "@/lib/api";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { UploadPage } from "@/components/upload/UploadPage";
import { ProcessingView } from "@/components/processing/ProcessingView";
import { ResultsLayout } from "@/components/results/ResultsLayout";
import { Toast } from "@/components/ui/Toast";

const PROCESSING_STAGES: ProcessingStage[] = [
  "uploading",
  "extracting_questions",
  "reading_answers",
  "mapping_answers",
  "preparing_results",
];

function toUploadedFile(file: File): UploadedFile {
  return {
    file,
    name: file.name,
    sizeMb: file.size / (1024 * 1024),
  };
}

export default function Home() {
  const [appState, setAppState] = useState<AppState>("upload");
  const [questionPaper, setQuestionPaper] = useState<UploadedFile | null>(null);
  const [answerSheet, setAnswerSheet] = useState<UploadedFile | null>(null);
  const [processingStage, setProcessingStage] = useState<ProcessingStage>("uploading");
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleTabClick = useCallback((label: string) => {
    if (label === "Exams" || label === "Exams (Active Module)") {
      setAppState("upload");
      return;
    }
    setToastMessage(`This is just a prototype. The '${label}' section is currently unavailable.`);
  }, []);

  const handleStartMapping = useCallback(async () => {
    if (!questionPaper || !answerSheet) return;
    setError(null);
    setAppState("processing");

    // Simulate realistic stage progression while API processes
    const stageInterval = setInterval(() => {
      setProcessingStage((prev) => {
        const idx = PROCESSING_STAGES.indexOf(prev);
        if (idx < PROCESSING_STAGES.length - 2) {
          return PROCESSING_STAGES[idx + 1];
        }
        return prev;
      });
    }, 4000);

    try {
      setProcessingStage("uploading");
      const result = await processAssessment(questionPaper.file, answerSheet.file);
      setProcessingStage("preparing_results");
      clearInterval(stageInterval);
      await new Promise((r) => setTimeout(r, 600));
      setAssessmentResult(result);
      setAppState("results");
    } catch (err: unknown) {
      clearInterval(stageInterval);
      const message =
        err instanceof Error
          ? err.message
          : "We couldn't process the assessment right now. Please try again.";
      setError(message);
      setAppState("upload");
    }
  }, [questionPaper, answerSheet]);

  const handleReset = useCallback(() => {
    setAppState("upload");
    setAssessmentResult(null);
    setError(null);
    setProcessingStage("uploading");
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar — hidden on mobile */}
      <Sidebar onTabClick={handleTabClick} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <MobileHeader onTabClick={handleTabClick} />

        {appState === "upload" && (
          <UploadPage
            questionPaper={questionPaper}
            answerSheet={answerSheet}
            onQuestionPaperSelect={(f) => setQuestionPaper(toUploadedFile(f))}
            onAnswerSheetSelect={(f) => setAnswerSheet(toUploadedFile(f))}
            onQuestionPaperRemove={() => setQuestionPaper(null)}
            onAnswerSheetRemove={() => setAnswerSheet(null)}
            onStartMapping={handleStartMapping}
            error={error}
          />
        )}

        {appState === "processing" && (
          <ProcessingView stage={processingStage} />
        )}

        {appState === "results" && assessmentResult && answerSheet && (
          <ResultsLayout
            result={assessmentResult}
            answerSheetFile={answerSheet.file}
            onReset={handleReset}
          />
        )}
      </div>

      {/* Prototype Notice Toast */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
