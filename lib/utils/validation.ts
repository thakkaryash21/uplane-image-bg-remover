/**
 * File validation utilities for uploaded images
 */

import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
} from '@/lib/constants/image-formats';

export interface ValidationSuccess {
  valid: true;
}

export interface ValidationError {
  valid: false;
  error: string;
}

export type ValidationResult = ValidationSuccess | ValidationError;

/**
 * Validates an uploaded image file for type and size constraints.
 * 
 * @param file - The uploaded File object to validate
 * @returns ValidationResult indicating success or failure with error message
 */
export function validateImageFile(file: File): ValidationResult {
  // Check if file exists
  if (!file) {
    return {
      valid: false,
      error: 'No file provided',
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE_MB}MB`,
    };
  }

  // Check file size is not zero
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty',
    };
  }

  // Check MIME type
  if (
    !(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)
  ) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
    };
  }

  return { valid: true };
}
