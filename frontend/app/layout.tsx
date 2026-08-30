import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "VedaAI — AI Assessment Extraction & Answer Mapping",
  description:
    "Upload a question paper and student answer sheet. VedaAI extracts questions, reads handwritten answers, maps them together, and highlights exact answer regions.",
  keywords: ["AI", "assessment", "grading", "handwriting", "education", "teacher"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-inter antialiased bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
