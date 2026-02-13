/**
 * Domain types for image processing and storage
 */

export interface ProcessedImage {
  /** UUID used as blob pathname prefix */
  id: string;
  /** Public Vercel Blob URL for the processed image */
  url: string;
  /** Original filename from upload */
  originalName: string;
  /** File size in bytes */
  size: number;
  /** ISO 8601 timestamp of when the image was created */
  createdAt: string;
}
