"use client";

import { useConversion } from "@/lib/hooks/use-conversion";
import { formatFileSize } from "@/lib/utils/format";
import TransparencyBackground from "./transparency-background";
import Button from "./button";
import Card from "./card";
import Spinner from "./spinner";

interface ConversionResultProps {
  conversionId: string;
  onDeleteClick: (id: string) => void;
  onNewConversion: () => void;
}

/**
 * Before/after comparison view for a processed image
 * Shows original and processed images side-by-side with actions
 */
export default function ConversionResult({
  conversionId,
  onDeleteClick,
  onNewConversion,
}: ConversionResultProps) {
  const { conversion, isLoading, error } = useConversion(conversionId);

  const handleDownload = async () => {
    if (!conversion) return;

    try {
      const response = await fetch(conversion.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `processed_${conversion.originalName}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert("Failed to download image");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !conversion) {
    return (
      <Card>
        <div className="text-center py-12">
          <p className="text-error-600 dark:text-error-400 mb-4">
            {error || "Conversion not found"}
          </p>
          <Button onClick={onNewConversion} variant="secondary">
            Back to Upload
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metadata */}
      {/* Metadata */}
      <Card className="!p-4">
        <div className="flex flex-row items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {conversion.originalName}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatFileSize(conversion.size)} •{" "}
              {new Date(conversion.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          <Button
            onClick={() => onDeleteClick(conversion.id)}
            variant="danger"
            className="shrink-0"
            title="Delete conversion"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            <span className="hidden sm:inline">Delete</span>
          </Button>
        </div>
      </Card>

      {/* Before/After Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Original */}
        <Card>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
            Original
          </h3>
          <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Checkerboard pattern for transparency */}
            <TransparencyBackground />
            <img
              src={conversion.originalUrl}
              alt="Original"
              className="w-full h-auto relative z-10"
            />
          </div>
        </Card>

        {/* Processed */}
        <Card>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
            Processed
          </h3>
          <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Checkerboard pattern for transparency */}
            <TransparencyBackground />
            <img
              src={conversion.url}
              alt="Processed"
              className="w-full h-auto relative z-10"
            />
          </div>
        </Card>
      </div>

      {/* Actions */}
      {/* URL Display */}
      <Card className="!p-0 overflow-hidden">
        <div className="flex bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex-1 px-4 py-3 overflow-x-auto whitespace-nowrap scrollbar-hide flex items-center">
            <code className="text-sm font-mono text-gray-600 dark:text-gray-300">
              {window.location.origin}
              {conversion.url}
            </code>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}${conversion.url}`,
              );
            }}
            className="px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border-l border-gray-200 dark:border-gray-700 transition-colors flex items-center justify-center shrink-0"
            title="Copy URL"
          >
            <svg
              className="w-5 h-5 text-gray-500 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </button>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={onNewConversion}
          variant="secondary"
          className="flex-1"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Conversion
        </Button>

        <Button onClick={handleDownload} variant="primary" className="flex-1">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download
        </Button>
      </div>
    </div>
  );
}
