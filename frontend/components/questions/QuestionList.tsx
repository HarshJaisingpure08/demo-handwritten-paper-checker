"use client";
import { useState } from "react";
import { Answer, AssessmentResult, Question } from "@/lib/types";
import { QuestionCard } from "./QuestionCard";
import { AssessmentSummaryBar } from "@/components/results/AssessmentSummary";
import { ChevronDown } from "lucide-react";

interface QuestionListProps {
  result: AssessmentResult;
  selectedQuestionId: string | null;
  onSelectQuestion: (question: Question, answer: Answer | null) => void;
}

export function QuestionList({
  result,
  selectedQuestionId,
  onSelectQuestion,
}: QuestionListProps) {
  const [allExpanded, setAllExpanded] = useState(false);

  const getAnswer = (question: Question): Answer | null => {
    if (!question.answer_ids.length) return null;
    return result.answers.find((a) => a.id === question.answer_ids[0]) ?? null;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-800">
            Extracted Questions{" "}
            <span className="text-gray-400 font-normal">
              ({result.questions.length})
            </span>
          </h2>
          <button
            onClick={() => setAllExpanded(!allExpanded)}
            className="text-xs text-orange-500 hover:text-orange-600 font-medium"
          >
            {allExpanded ? "Collapse All" : "Expand All"}
          </button>
        </div>
        <AssessmentSummaryBar
          summary={result.summary}
          provider={result.provider}
          fallbackUsed={result.fallback_used}
        />
      </div>

      {/* Question cards */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {result.questions.map((question) => {
          const answer = getAnswer(question);
          return (
            <QuestionCard
              key={question.id}
              question={question}
              answer={answer}
              isSelected={selectedQuestionId === question.id}
              onClick={() => onSelectQuestion(question, answer)}
              index={question.order}
            />
          );
        })}

        {/* Unmatched answers section */}
        {result.unmatched_answers.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Unmatched Answers ({result.unmatched_answers.length})
            </p>
            {result.unmatched_answers.map((ans) => (
              <div
                key={ans.id}
                className="border border-dashed border-amber-300 bg-amber-50/50 rounded-xl px-4 py-3 mb-2"
              >
                <p className="text-xs font-medium text-amber-700">Unmatched answer</p>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{ans.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
