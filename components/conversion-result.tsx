"use client";

import { useState, useEffect } from "react";
import type { ProcessedImage } from "@/lib/types/image";
import Button from "./button";
import Card from "./card";
import Spinner from "./spinner";

interface ConversionResultProps {
  conversionId: string;
  onDelete: (id: string) => Promise<void>;
  onNewConversion: () => void;
}

/**
 * Before/after comparison view for a processed image
 * Shows original and processed images side-by-side with actions
 */
export default function ConversionResult({
  conversionId,
  onDelete,
  onNewConversion,
}: ConversionResultProps) {
  const [conversion, setConversion] = useState<ProcessedImage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function fetchConversion() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/images/${conversionId}`);

        if (!response.ok) {
          throw new Error("Failed to load conversion");
        }

        const data = await response.json();

        if (data.success) {
          setConversion(data.data);
        } else {
          setError(data.error.message);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    fetchConversion();
  }, [conversionId]);

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

  const handleDelete = async () => {
    if (!conversion) return;

    if (confirm("Are you sure you want to delete this conversion?")) {
      setIsDeleting(true);
      try {
        await onDelete(conversion.id);
        onNewConversion(); // Navigate back to upload view
      } catch (err) {
        alert("Failed to delete conversion");
      } finally {
        setIsDeleting(false);
      }
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Metadata */}
      <Card className="!p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
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
        </div>
      </Card>

      {/* Before/After Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Original */}
        <Card>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
            Original
          </h3>
          <div className="aspect-auto max-h-[300px] md:max-h-[500px] overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <img
              src={conversion.originalUrl}
              alt="Original"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </Card>

        {/* Processed */}
        <Card>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
            Processed
          </h3>
          <div className="aspect-auto max-h-[300px] md:max-h-[500px] overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <img
              src={conversion.url}
              alt="Processed"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
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

        <Button
          onClick={handleDelete}
          variant="danger"
          isLoading={isDeleting}
          className="flex-1 sm:flex-initial"
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
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Delete
        </Button>
      </div>
    </div>
  );
}
