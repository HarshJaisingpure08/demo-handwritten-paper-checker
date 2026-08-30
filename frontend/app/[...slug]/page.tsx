"use client";
import React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { useParams } from "next/navigation";

export default function CatchAllPrototypePage() {
  const params = useParams();
  const slugArray = params?.slug ? (Array.isArray(params.slug) ? params.slug : [params.slug]) : [];
  const routeName = slugArray.join("/") || "requested route";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-8 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-gray-900">Prototype Notice</h1>
          <p className="text-sm text-gray-600">
            The route <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-orange-600">/{routeName}</span> is not functional.
          </p>
          <p className="text-xs text-gray-500 leading-relaxed pt-2">
            This application is currently a prototype focused exclusively on the <strong className="text-gray-800">VedaAI Exams &amp; Assessment Mapping</strong> module.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 w-full bg-gray-900 hover:bg-gray-800 text-white font-medium px-5 py-3 rounded-full text-sm transition-all shadow-md hover:shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Assessment Mapping (Exams)
        </Link>
      </div>
    </div>
  );
}
