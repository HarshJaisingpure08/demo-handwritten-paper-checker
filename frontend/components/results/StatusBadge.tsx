"use client";
import { QuestionStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: QuestionStatus;
  size?: "sm" | "md";
}

const config: Record<QuestionStatus, { label: string; className: string }> = {
  answered: { label: "Answered", className: "bg-green-100 text-green-700" },
  unanswered: { label: "Not answered", className: "bg-gray-100 text-gray-500" },
  needs_review: { label: "Needs review", className: "bg-amber-100 text-amber-700" },
};

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const { label, className } = config[status];
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${className} ${
        size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-3 py-1"
      }`}
    >
      {label}
    </span>
  );
}
