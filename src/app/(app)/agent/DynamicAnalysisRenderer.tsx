'use client';

interface DynamicAnalysisRendererProps {
  html: string;
}

export function DynamicAnalysisRenderer({ html }: DynamicAnalysisRendererProps) {
  return (
    <div
      className="bg-gray-900 text-gray-100 p-4 sm:p-6 rounded-lg border border-gray-700 shadow-xl"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}