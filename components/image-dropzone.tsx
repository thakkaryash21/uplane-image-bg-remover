"use client";

import { useRef, useState, DragEvent } from "react";
import Alert from "./alert";
import Spinner from "./spinner";
import ScannerPreview from "./scanner-preview";
import {
  ALLOWED_IMAGE_ACCEPT,
  ALLOWED_IMAGE_LABEL,
  MAX_FILE_SIZE_LABEL,
} from "@/lib/constants/image-formats";
import { IconUpload } from "./icons";

interface ImageDropzoneProps {
  isUploading: boolean;
  uploadingFile?: File | null;
  error?: string | null;
  onFileSelect: (file: File) => Promise<void>;
  onRetry: () => void;
}

/**
 * Drag-and-drop image upload zone
 * Features:
 * - Click to browse OR drag-and-drop
 * - Client-side file validation
 * - Loading states with spinner
 * - Error display with retry
 * - Full-page drag overlay (rendered via portal managed by parent)
 */
export default function ImageDropzone({
  isUploading,
  uploadingFile,
  error,
  onFileSelect,
  onRetry,
}: ImageDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      await onFileSelect(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      await onFileSelect(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert type="error">
          <div className="flex items-center justify-between">
            <span>{error}</span>
          </div>
        </Alert>
      )}

      {/* Upload Zone */}
      <div
        className={`dropzone ${isDragging ? "dropzone-active" : ""} ${
          isUploading ? "cursor-not-allowed opacity-60" : ""
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={isUploading ? undefined : handleClick}
        role="button"
        tabIndex={isUploading ? -1 : 0}
        aria-label="Upload image"
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !isUploading) {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-4 py-12">
            {uploadingFile ? (
              <ScannerPreview file={uploadingFile} />
            ) : (
              <Spinner size="lg" />
            )}
            <div className="text-center">
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Processing your image...
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Removing background and applying transformations
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-12">
            <IconUpload
              size="lg"
              className="text-gray-400 dark:text-gray-600"
            />

            <div className="text-center">
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Drag and drop your image here
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                or click to browse
              </p>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              {ALLOWED_IMAGE_LABEL} • {MAX_FILE_SIZE_LABEL}
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_IMAGE_ACCEPT}
          className="hidden"
          onChange={handleFileInputChange}
          disabled={isUploading}
        />
      </div>
    </div>
  );
}
