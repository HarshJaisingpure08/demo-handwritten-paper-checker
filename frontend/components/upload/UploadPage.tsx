"use client";
import React from "react";
import { ArrowRight } from "lucide-react";
import { FileUploadCard } from "./FileUploadCard";
import { UploadedFile } from "@/lib/types";

interface UploadPageProps {
  questionPaper: UploadedFile | null;
  answerSheet: UploadedFile | null;
  onQuestionPaperSelect: (file: File) => void;
  onAnswerSheetSelect: (file: File) => void;
  onQuestionPaperRemove: () => void;
  onAnswerSheetRemove: () => void;
  onStartMapping: () => void;
  error?: string | null;
}

export function UploadPage({
  questionPaper,
  answerSheet,
  onQuestionPaperSelect,
  onAnswerSheetSelect,
  onQuestionPaperRemove,
  onAnswerSheetRemove,
  onStartMapping,
  error,
}: UploadPageProps) {
  const bothUploaded = questionPaper !== null && answerSheet !== null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-64px)] lg:min-h-screen px-4 py-10 bg-gradient-to-br from-gray-50 to-white">
      {/* Heading */}
      <div className="text-center mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
          Upload{" "}
          <span className="text-orange-500">Question Paper &amp; Answer Sheets</span>
        </h1>
        <p className="text-gray-500 mt-2 text-sm lg:text-base">
          Upload both files to get started
        </p>
      </div>

      {/* Teacher illustration */}
      <div className="mb-8">
        <div className="w-24 h-24 rounded-full border-4 border-orange-200 overflow-hidden bg-orange-50 flex items-center justify-center relative">
          {/* Decorative dots around circle */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-orange-300 animate-spin-slow" />
          <svg viewBox="0 0 100 100" className="w-16 h-16" xmlns="http://www.w3.org/2000/svg">
            {/* Simple teacher avatar */}
            <circle cx="50" cy="35" r="18" fill="#f97316" />
            <circle cx="50" cy="35" r="14" fill="#fed7aa" />
            <rect x="32" y="52" width="36" height="30" rx="8" fill="#f97316" />
            <circle cx="42" cy="32" r="3" fill="#1f2937" />
            <circle cx="58" cy="32" r="3" fill="#1f2937" />
            <path d="M43 42 Q50 47 57 42" stroke="#1f2937" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Upload cards */}
      <div className="w-full max-w-2xl grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <FileUploadCard
          label="Upload"
          accentLabel="Question Paper"
          file={questionPaper}
          onFileSelect={onQuestionPaperSelect}
          onRemove={onQuestionPaperRemove}
        />
        <FileUploadCard
          label="Upload"
          accentLabel="Answer Sheet"
          file={answerSheet}
          onFileSelect={onAnswerSheetSelect}
          onRemove={onAnswerSheetRemove}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="w-full max-w-2xl mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      {/* CTA */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={onStartMapping}
          disabled={!bothUploaded}
          className={`flex items-center gap-2 px-7 py-3 rounded-full font-semibold text-sm transition-all ${
            bothUploaded
              ? "bg-gray-900 text-white hover:bg-gray-800 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          Start Mapping
          <ArrowRight className="w-4 h-4" />
        </button>
        <p className="text-xs text-gray-400 text-center max-w-xs">
          Once both files are uploaded, you'll be able to map answers with questions
        </p>
      </div>
    </div>
  );
}
