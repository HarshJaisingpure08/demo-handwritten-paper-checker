"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnswerRegion } from "@/lib/types";
import { AnswerHighlight } from "./AnswerHighlight";
import { PageControls } from "./PageControls";

// Lazy-load react-pdf to avoid SSR issues
import dynamic from "next/dynamic";

const PDFPage = dynamic(
  () => import("./PDFPageRenderer").then((m) => m.PDFPageRenderer),
  { ssr: false }
);

interface AnswerSheetViewerProps {
  answerSheetFile: File;
  currentPage: number;
  totalPages: number;
  highlightRegions: AnswerRegion[];
  onPageChange: (page: number) => void;
  isPdf: boolean;
}

export function AnswerSheetViewer({
  answerSheetFile,
  currentPage,
  totalPages,
  highlightRegions,
  onPageChange,
  isPdf,
}: AnswerSheetViewerProps) {
  const [zoom, setZoom] = useState(1.0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerDims, setContainerDims] = useState({ w: 0, h: 0 });

  const onZoomIn = () => setZoom((z) => Math.min(3, z + 0.25));
  const onZoomOut = () => setZoom((z) => Math.max(0.5, z - 0.25));

  const onDimsChange = useCallback((w: number, h: number) => {
    setContainerDims({ w, h });
  }, []);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-gray-200">
        <span className="text-sm font-semibold text-gray-700">Answer Sheet</span>
        <PageControls
          currentPage={currentPage}
          totalPages={totalPages}
          zoom={zoom}
          onPageChange={onPageChange}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
        />
      </div>

      {/* Viewer */}
      <div ref={containerRef} className="flex-1 overflow-auto flex justify-center bg-gray-100 p-4">
        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: "top center", transition: "transform 0.2s" }}
        >
          {isPdf ? (
            <PDFPage
              file={answerSheetFile}
              pageNumber={currentPage}
              highlightRegions={highlightRegions.filter((r) => r.page === currentPage)}
              onDimsChange={onDimsChange}
            />
          ) : (
            <ImagePage
              file={answerSheetFile}
              highlightRegions={highlightRegions.filter((r) => r.page === currentPage)}
              onDimsChange={onDimsChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Image renderer ────────────────────────────────────────────────────────────

interface ImagePageProps {
  file: File;
  highlightRegions: AnswerRegion[];
  onDimsChange: (w: number, h: number) => void;
}

function ImagePage({ file, highlightRegions, onDimsChange }: ImagePageProps) {
  const [src, setSrc] = useState<string>("");
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const [dims, setDims] = useState({ w: 0, h: 0 });

  const handleLoad = () => {
    if (imgRef.current) {
      const w = imgRef.current.offsetWidth;
      const h = imgRef.current.offsetHeight;
      setDims({ w, h });
      onDimsChange(w, h);
    }
  };

  if (!src) return null;

  return (
    <div className="relative inline-block shadow-xl rounded-lg overflow-hidden bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt="Answer sheet"
        onLoad={handleLoad}
        style={{ maxWidth: "700px", display: "block" }}
        className="rounded-lg"
      />
      {dims.w > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          <AnswerHighlight
            regions={highlightRegions}
            currentPage={1}
            containerWidth={dims.w}
            containerHeight={dims.h}
          />
        </div>
      )}
    </div>
  );
}
