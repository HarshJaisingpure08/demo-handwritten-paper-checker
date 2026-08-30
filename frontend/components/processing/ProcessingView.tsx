"use client";
import { useEffect, useState } from "react";
import { ProcessingStage } from "@/lib/types";

const stages: { stage: ProcessingStage; label: string; sub: string }[] = [
  { stage: "uploading", label: "Uploading files...", sub: "This may take a moment" },
  { stage: "extracting_questions", label: "Extracting questions...", sub: "Reading the question paper" },
  { stage: "reading_answers", label: "Reading answers...", sub: "Analysing handwritten answers" },
  { stage: "mapping_answers", label: "Mapping answers...", sub: "Connecting answers to questions" },
  { stage: "preparing_results", label: "Preparing results...", sub: "Almost there!" },
];

interface ProcessingViewProps {
  stage: ProcessingStage;
}

export function ProcessingView({ stage }: ProcessingViewProps) {
  const current = stages.find((s) => s.stage === stage) || stages[0];

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-64px)] lg:min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Sparkle / AI icon — matches Figma orange diamond */}
      <div className="mb-8 relative">
        <div className="w-20 h-20 flex items-center justify-center">
          {/* Animated sparkle diamonds like Figma */}
          <svg
            viewBox="0 0 80 80"
            className="w-20 h-20 animate-pulse"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Large center diamond */}
            <path
              d="M40 5 L55 40 L40 75 L25 40 Z"
              fill="#f97316"
            />
            {/* Small top-right diamond */}
            <path
              d="M65 10 L72 25 L65 40 L58 25 Z"
              fill="#fb923c"
              opacity="0.7"
            />
            {/* Small bottom-left diamond */}
            <path
              d="M12 45 L19 57 L12 70 L5 57 Z"
              fill="#fb923c"
              opacity="0.5"
            />
          </svg>
        </div>
        {/* Spinning orbit ring */}
        <div className="absolute inset-0 rounded-full border-2 border-orange-200 border-dashed animate-spin-slow" />
      </div>

      <h2 className="text-xl font-semibold text-gray-800 mb-2">{current.label}</h2>
      <p className="text-sm text-gray-400">{current.sub}</p>

      {/* Progress dots */}
      <div className="flex gap-2 mt-8">
        {stages.map((s, i) => {
          const currentIdx = stages.findIndex((st) => st.stage === stage);
          return (
            <div
              key={s.stage}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i <= currentIdx ? "bg-orange-400 w-6" : "bg-gray-200 w-3"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
