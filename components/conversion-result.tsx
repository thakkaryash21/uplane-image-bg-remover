"use client";

import { useState, useRef, useEffect } from "react";
import { useConversion } from "@/lib/hooks/use-conversion";
import { formatFileSize, getBaseName, getExtension } from "@/lib/utils/format";
import TransparencyBackground from "./transparency-background";
import Button from "./button";
import Card from "./card";
import Spinner from "./spinner";
import { IconTrash, IconPlus, IconDownload, IconCopy } from "./icons";

interface ConversionResultProps {
  conversionId: string;
  onDeleteClick: (id: string) => void;
  onNewConversion: () => void;
  onRenameSuccess?: () => void;
}

/**
 * Before/after comparison view for a processed image
 * Shows original and processed images side-by-side with actions
 */
export default function ConversionResult({
  conversionId,
  onDeleteClick,
  onNewConversion,
  onRenameSuccess,
}: ConversionResultProps) {
  const { conversion, isLoading, error, rename } = useConversion(conversionId);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSaveRename = async () => {
    if (!conversion) return;
    const baseName = getBaseName(editValue.trim()).trim();
    if (!baseName) {
      setIsEditing(false);
      setEditValue("");
      return;
    }
    const ext = getExtension(conversion.name);
    const fullName = baseName + ext;
    if (fullName === conversion.name) {
      setIsEditing(false);
      setEditValue("");
      return;
    }
    try {
      await rename(fullName);
      setIsEditing(false);
      setEditValue("");
      onRenameSuccess?.();
    } catch {
      /* keep edit mode on error */
    }
  };

  const handleCancelRename = () => {
    setIsEditing(false);
    setEditValue("");
  };

  const handleDoubleClick = () => {
    if (!conversion) return;
    setEditValue(getBaseName(conversion.name));
    setIsEditing(true);
  };

  const handleDownload = async () => {
    if (!conversion) return;

    try {
      const response = await fetch(conversion.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `processed_${conversion.name}`;
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
      <Card className="!p-4">
        <div className="flex flex-row items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSaveRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveRename();
                  if (e.key === "Escape") handleCancelRename();
                }}
                style={{ width: `${Math.max(editValue.length, 1) + 1}ch` }}
                className="font-medium text-gray-900 dark:text-gray-100 bg-transparent border-b border-gray-300 dark:border-gray-600 outline-none py-0.5 min-w-0 max-w-full block"
              />
            ) : (
              <h3
                onDoubleClick={handleDoubleClick}
                className="font-medium text-gray-900 dark:text-gray-100 truncate cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-1 -mx-1 w-fit max-w-full"
                title="Double-click to rename"
              >
                {conversion.name}
              </h3>
            )}
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
            <IconTrash size="sm" />
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
            <IconCopy
              size="md"
              className="text-gray-500 dark:text-gray-400"
            />
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
          <IconPlus size="md" />
          New Conversion
        </Button>

        <Button onClick={handleDownload} variant="primary" className="flex-1">
          <IconDownload size="md" />
          Download
        </Button>
      </div>
    </div>
  );
}
