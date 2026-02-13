import type { Conversion } from '@prisma/client';

/**
 * Domain types for image processing and storage
 */

export interface ProcessedImage {
  /** UUID of the conversion record */
  id: string;
  /** Proxy URL to access the processed image (e.g., /api/conversions/{id}/processed) - NOT the blob URL */
  url: string;
  /** Proxy URL to access the original image (e.g., /api/conversions/{id}/original) */
  originalUrl: string;
  /** Display name (filename) for the conversion */
  name: string;
  /** File size in bytes */
  size: number;
  /** ISO 8601 timestamp of when the image was created */
  createdAt: string;
}

/**
 * Convert a Conversion database record to a ProcessedImage API response
 * 
 * Maps the internal blob URL to a public proxy URL that enforces authentication.
 * 
 * @param conversion - Conversion record from database
 * @returns ProcessedImage for API response
 */
export function toProcessedImage(conversion: Conversion): ProcessedImage {
  return {
    id: conversion.id,
    url: `/api/conversions/${conversion.id}/processed`,
    originalUrl: `/api/conversions/${conversion.id}/original`,
    name: conversion.name,
    size: conversion.size,
    createdAt: conversion.createdAt.toISOString(),
  };
}
