"use client";
import { AssessmentSummary as SummaryType } from "@/lib/types";
import { CheckCircle, XCircle, AlertCircle, HelpCircle } from "lucide-react";

interface AssessmentSummaryProps {
  summary: SummaryType;
  provider: string;
  fallbackUsed: boolean;
}

export function AssessmentSummaryBar({ summary, provider, fallbackUsed }: AssessmentSummaryProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
      <span className="flex items-center gap-1">
        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
        <span className="font-medium text-gray-700">{summary.answered}</span> answered
      </span>
      <span className="flex items-center gap-1">
        <XCircle className="w-3.5 h-3.5 text-gray-400" />
        <span className="font-medium text-gray-700">{summary.unanswered}</span> unanswered
      </span>
      {summary.needs_review > 0 && (
        <span className="flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-medium text-gray-700">{summary.needs_review}</span> needs review
        </span>
      )}
      {summary.earned_marks != null && summary.total_marks != null && (
        <span className="ml-auto font-semibold text-gray-800">
          {summary.earned_marks}/{summary.total_marks} marks
        </span>
      )}
      <span className="ml-auto text-[10px] text-gray-400 capitalize">
        via {provider}{fallbackUsed ? " (fallback)" : ""}
      </span>
    </div>
  );
}
