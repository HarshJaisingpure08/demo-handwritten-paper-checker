"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Answer, Question } from "@/lib/types";
import { StatusBadge } from "@/components/results/StatusBadge";
import { getScoreColor } from "@/lib/utils";

interface QuestionCardProps {
  question: Question;
  answer?: Answer | null;
  isSelected: boolean;
  onClick: () => void;
  index: number;
}

export function QuestionCard({ question, answer, isSelected, onClick, index }: QuestionCardProps) {
  const [expanded, setExpanded] = useState(false);

  const hasScore =
    question.earned_marks != null && question.total_marks != null;
  const scoreColor = hasScore
    ? getScoreColor(question.earned_marks!, question.total_marks!)
    : "";

  return (
    <div
      className={`border rounded-xl transition-all duration-200 cursor-pointer ${
        isSelected
          ? "border-orange-400 bg-orange-50/60 shadow-md"
          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
      }`}
      onClick={onClick}
    >
      {/* Header row */}
      <div className="flex items-start gap-3 px-4 py-3">
        {/* Question number circle */}
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
            isSelected ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600"
          }`}
        >
          {question.number}
        </div>

        {/* Question text */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm leading-snug line-clamp-2 ${
              question.status === "unanswered" ? "text-gray-400" : "text-gray-800"
            }`}
          >
            {question.text}
          </p>

          {/* Status / score row */}
          <div className="flex items-center gap-2 mt-1.5">
            {question.status === "unanswered" ? (
              <StatusBadge status="unanswered" />
            ) : hasScore ? (
              <>
                {question.status === "needs_review" && (
                  <StatusBadge status="needs_review" />
                )}
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${scoreColor}`}
                >
                  {question.earned_marks} / {question.total_marks}
                </span>
              </>
            ) : question.status === "needs_review" ? (
              <StatusBadge status="needs_review" />
            ) : (
              <StatusBadge status="answered" />
            )}
          </div>
        </div>

        {/* Expand toggle */}
        {question.status === "answered" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Expanded content */}
      {expanded && question.status === "answered" && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-2">
          {/* Answer text */}
          {answer?.text && (
            <div>
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">
                Student's Answer
              </p>
              <p className="text-xs text-gray-700 leading-relaxed line-clamp-4">
                {answer.text}
              </p>
            </div>
          )}

          {/* Confidence & Marks */}
          {answer && (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-gray-400">
                  Confidence:{" "}
                  <span className="font-medium text-gray-600">
                    {Math.round(answer.confidence * 100)}%
                  </span>
                </p>
                {answer.confidence < 0.7 && (
                  <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded">
                    Low confidence
                  </span>
                )}
              </div>
              <div className="text-[10px] font-medium text-gray-500">
                Marks:{" "}
                {hasScore ? (
                  <span className="font-bold text-gray-800">
                    {question.earned_marks}/{question.total_marks}
                  </span>
                ) : (
                  <span className="text-gray-400">N/A</span>
                )}
              </div>
            </div>
          )}

          {/* AI Feedback */}
          {question.feedback && (
            <div className="bg-white border border-gray-100 rounded-lg p-3">
              <p className="text-[10px] font-semibold text-gray-500 flex items-center gap-1 mb-1">
                <Sparkles className="w-3 h-3 text-orange-400" />
                AI Feedback
              </p>
              <p className="text-xs text-gray-700 leading-relaxed">
                {question.feedback}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
