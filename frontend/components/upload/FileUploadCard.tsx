"use client";
import React, { useRef } from "react";
import { Upload, X, FileText, Image as ImageIcon } from "lucide-react";
import { UploadedFile } from "@/lib/types";
import { formatFileSize } from "@/lib/utils";

interface FileUploadCardProps {
  label: string;
  accentLabel: string;
  file: UploadedFile | null;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  accept?: string;
}

export function FileUploadCard({
  label,
  accentLabel,
  file,
  onFileSelect,
  onRemove,
  accept = ".pdf,.png,.jpg,.jpeg",
}: FileUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) onFileSelect(dropped);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) onFileSelect(selected);
    e.target.value = "";
  };

  const isPdf = file?.name.toLowerCase().endsWith(".pdf");

  if (file) {
    return (
      <div className="relative bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm">
        {/* Remove button */}
        <button
          onClick={onRemove}
          className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          aria-label="Remove file"
        >
          <X className="w-3.5 h-3.5 text-gray-500" />
        </button>

        {/* Icon */}
        <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
          {isPdf ? (
            <span className="text-red-500 font-bold text-xs uppercase">PDF</span>
          ) : (
            <ImageIcon className="w-5 h-5 text-red-400" />
          )}
        </div>

        {/* File info */}
        <div className="min-w-0 pr-6">
          <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{file.sizeMb.toFixed(1)}MB</p>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="bg-white border-2 border-dashed border-gray-200 rounded-2xl px-6 py-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-orange-300 hover:bg-orange-50/30 transition-all group"
    >
      <div className="w-10 h-10 flex items-center justify-center">
        <Upload className="w-7 h-7 text-gray-400 group-hover:text-orange-400 transition-colors" />
      </div>
      <div className="text-center">
        <p className="text-sm text-gray-700 font-medium">
          {label}{" "}
          <span className="text-orange-500 font-semibold">{accentLabel}</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">Max 10MB</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
