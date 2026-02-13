import { useState, useCallback } from "react";
import type { ProcessedImage } from "@/lib/types/image";
import type { ApiResponse } from "@/lib/types/api";

// Reuse validation constants from backend
const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface UseUploadResult {
  upload: (file: File) => Promise<ProcessedImage>;
  isUploading: boolean;
  error: string | null;
  reset: () => void;
}

/**
 * Custom hook to manage image upload flow
 * Handles client-side validation, API call, and error mapping
 */
export function useUpload(): UseUploadResult {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File): Promise<ProcessedImage> => {
      setError(null);

      // Client-side validation
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        const errorMessage = `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`;
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      if (file.size > MAX_FILE_SIZE) {
        const errorMessage = `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`;
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      if (file.size === 0) {
        const errorMessage = "File is empty";
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data: ApiResponse<ProcessedImage> = await response.json();

        if (!data.success) {
          // Map API error codes to user-friendly messages
          const errorMessages: Record<string, string> = {
            BG_REMOVAL_QUOTA_EXCEEDED:
              "Background removal quota exceeded. Please try again later.",
            BG_REMOVAL_SERVICE_UNAVAILABLE:
              "Background removal service is temporarily unavailable. Please try again.",
            BG_REMOVAL_INVALID_IMAGE:
              "Invalid or corrupted image file. Please try a different image.",
            INVALID_FILE: "Invalid file. Please upload a valid image.",
            FILE_REQUIRED:
              "No file provided. Please select an image to upload.",
            STORAGE_ERROR:
              "Failed to store the processed image. Please try again.",
          };

          const friendlyMessage =
            errorMessages[data.error.code] ||
            data.error.message ||
            "An error occurred during upload";

          setError(friendlyMessage);
          throw new Error(friendlyMessage);
        }

        return data.data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Upload failed";
        setError(errorMessage);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setError(null);
    setIsUploading(false);
  }, []);

  return {
    upload,
    isUploading,
    error,
    reset,
  };
}
