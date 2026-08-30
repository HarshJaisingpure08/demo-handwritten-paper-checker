"use client";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

interface PageControlsProps {
  currentPage: number;
  totalPages: number;
  zoom: number;
  onPageChange: (page: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export function PageControls({
  currentPage,
  totalPages,
  zoom,
  onPageChange,
  onZoomIn,
  onZoomOut,
}: PageControlsProps) {
  return (
    <div className="flex items-center gap-3 text-sm text-gray-600">
      {/* Zoom */}
      <div className="flex items-center gap-1">
        <button
          onClick={onZoomOut}
          className="p-1 rounded hover:bg-gray-100 transition-colors"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs font-medium w-12 text-center">{Math.round(zoom * 100)}%</span>
        <button
          onClick={onZoomIn}
          className="p-1 rounded hover:bg-gray-100 transition-colors"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-4 bg-gray-200" />

      {/* Page navigation */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-medium whitespace-nowrap">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
