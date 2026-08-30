"use client";
import React, { useCallback, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { AnswerRegion } from "@/lib/types";
import { AnswerHighlight } from "./AnswerHighlight";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFPageRendererProps {
  file: File;
  pageNumber: number;
  highlightRegions: AnswerRegion[];
  onDimsChange: (w: number, h: number) => void;
}

export function PDFPageRenderer({
  file,
  pageNumber,
  highlightRegions,
  onDimsChange,
}: PDFPageRendererProps) {
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const onRenderSuccess = useCallback(() => {
    if (containerRef.current) {
      const el = containerRef.current.querySelector("canvas");
      if (el) {
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        setDims({ w, h });
        onDimsChange(w, h);
      }
    }
  }, [onDimsChange]);

  return (
    <div ref={containerRef} className="relative inline-block shadow-xl rounded-lg overflow-hidden bg-white">
      <Document
        file={file}
        loading={
          <div className="w-[600px] h-[800px] flex items-center justify-center bg-white">
            <div className="animate-pulse text-gray-400 text-sm">Loading PDF...</div>
          </div>
        }
        error={
          <div className="w-[600px] h-[800px] flex items-center justify-center bg-white">
            <p className="text-red-500 text-sm">Failed to load PDF</p>
          </div>
        }
      >
        <Page
          pageNumber={pageNumber}
          width={600}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          onRenderSuccess={onRenderSuccess}
        />
      </Document>

      {dims.w > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          <AnswerHighlight
            regions={highlightRegions}
            currentPage={pageNumber}
            containerWidth={dims.w}
            containerHeight={dims.h}
          />
        </div>
      )}
    </div>
  );
}
