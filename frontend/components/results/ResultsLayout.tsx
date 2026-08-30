"use client";
import { useState } from "react";
import { Answer, AssessmentResult, Question } from "@/lib/types";
import { QuestionList } from "@/components/questions/QuestionList";
import { AnswerSheetViewer } from "@/components/viewer/AnswerSheetViewer";

interface ResultsLayoutProps {
  result: AssessmentResult;
  answerSheetFile: File;
  onReset: () => void;
}

export function ResultsLayout({ result, answerSheetFile, onReset }: ResultsLayoutProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
    result.questions[0] ?? null
  );
  const [selectedAnswer, setSelectedAnswer] = useState<Answer | null>(
    result.questions[0]?.answer_ids.length
      ? (result.answers.find((a) => a.id === result.questions[0].answer_ids[0]) ?? null)
      : null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [activeMobileTab, setActiveMobileTab] = useState<"questions" | "answer_sheet">("questions");

  const isPdf = answerSheetFile.name.toLowerCase().endsWith(".pdf");
  const totalPages = result.answer_sheet_page_count;
  const highlightRegions = selectedAnswer?.regions ?? [];

  const handleSelectQuestion = (question: Question, answer: Answer | null) => {
    setSelectedQuestion(question);
    setSelectedAnswer(answer);

    if (answer && answer.regions.length > 0) {
      const firstPage = answer.regions[0].page;
      setCurrentPage(firstPage);
      // On mobile, switch to answer sheet tab
      setActiveMobileTab("answer_sheet");
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Mobile tabs */}
      <div className="lg:hidden flex border-b border-gray-200 bg-white">
        {(["questions", "answer_sheet"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveMobileTab(tab)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeMobileTab === tab
                ? "text-gray-900 border-b-2 border-gray-900"
                : "text-gray-400"
            }`}
          >
            {tab === "questions" ? "Questions" : "Answer Sheet"}
          </button>
        ))}
      </div>

      {/* Desktop: side-by-side | Mobile: tabbed */}
      <div className="flex-1 flex overflow-hidden">
        {/* Questions panel */}
        <div
          className={`${
            activeMobileTab === "questions" ? "flex" : "hidden"
          } lg:flex flex-col border-r border-gray-200 bg-white overflow-hidden`}
          style={{ width: "380px", minWidth: "320px", flexShrink: 0 }}
        >
          <QuestionList
            result={result}
            selectedQuestionId={selectedQuestion?.id ?? null}
            onSelectQuestion={handleSelectQuestion}
          />
        </div>

        {/* Answer viewer panel */}
        <div
          className={`${
            activeMobileTab === "answer_sheet" ? "flex" : "hidden"
          } lg:flex flex-col flex-1 overflow-hidden`}
        >
          <AnswerSheetViewer
            answerSheetFile={answerSheetFile}
            currentPage={currentPage}
            totalPages={totalPages}
            highlightRegions={highlightRegions}
            onPageChange={setCurrentPage}
            isPdf={isPdf}
          />
        </div>
      </div>
    </div>
  );
}
