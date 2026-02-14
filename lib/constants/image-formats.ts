/**
 * Centralized image format and file size constants for upload validation.
 * Aligned with Sharp (flip library) input support; FormatNormalizationStep
 * converts all to PNG before Remove.bg.
 */

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/tiff",
  "image/svg+xml",
  "image/heic",
] as const;

/** Max file size: 4MB (within Vercel default body limit) */
export const MAX_FILE_SIZE_MB = 4;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/** Comma-separated MIME types for the file input accept attribute */
export const ALLOWED_IMAGE_ACCEPT = ALLOWED_MIME_TYPES.join(",");

/** Human-readable format list for UI */
export const ALLOWED_IMAGE_LABEL =
  "PNG, JPEG, WebP, GIF, AVIF, TIFF, SVG, HEIC";

/** Size limit label for UI */
export const MAX_FILE_SIZE_LABEL = `Max ${MAX_FILE_SIZE_MB}MB`;
