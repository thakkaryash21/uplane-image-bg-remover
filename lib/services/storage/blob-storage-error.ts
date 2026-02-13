/**
 * Custom error class for blob storage operations
 * 
 * This error is thrown by IBlobStorageService implementations when
 * upload, fetch, or delete operations fail. It provides a clear
 * distinction from other error types and makes error handling more robust
 * than relying on string matching in error messages.
 */
export class BlobStorageError extends Error {
  constructor(
    public readonly operation: 'upload' | 'fetch' | 'delete',
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = 'BlobStorageError';
    
    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BlobStorageError);
    }
  }
}
