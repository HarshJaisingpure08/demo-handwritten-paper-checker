"use client";
import React, { useRef, useEffect, useState } from "react";
import { AnswerRegion } from "@/lib/types";

interface AnswerHighlightProps {
  regions: AnswerRegion[];
  currentPage: number;
  containerWidth: number;
  containerHeight: number;
}

/**
 * Absolute-positioned highlight overlay.
 * Renders semi-transparent green rectangles over the answer regions
 * on the currently displayed page.
 */
export function AnswerHighlight({
  regions,
  currentPage,
  containerWidth,
  containerHeight,
}: AnswerHighlightProps) {
  if (!containerWidth || !containerHeight) return null;

  const pageRegions = regions.filter((r) => r.page === currentPage);

  return (
    <>
      {pageRegions.map((region, i) => {
        const left = region.x * containerWidth;
        const top = region.y * containerHeight;
        const width = region.width * containerWidth;
        const height = region.height * containerHeight;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${left}px`,
              top: `${top}px`,
              width: `${width}px`,
              height: `${height}px`,
              pointerEvents: "none",
            }}
            className="rounded-md"
          >
            {/* Translucent fill */}
            <div
              className="absolute inset-0 rounded-md"
              style={{ backgroundColor: "rgba(34, 197, 94, 0.15)" }}
            />
            {/* Border */}
            <div
              className="absolute inset-0 rounded-md border-2 border-green-500"
              style={{ boxShadow: "0 0 0 1px rgba(34,197,94,0.3)" }}
            />
            {/* Q label */}
            <div
              className="absolute -top-5 left-0 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded"
            >
              Ans
            </div>
          </div>
        );
      })}
    </>
  );
}
