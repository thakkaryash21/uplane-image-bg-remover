/**
 * Uniform error class for all pipeline step failures.
 * 
 * Each pipeline step throws this error type on failure, ensuring consistent
 * error handling throughout the processing pipeline. The error includes:
 * - stepName: identifies which step failed
 * - code: machine-readable error code for client handling
 * - statusCode: HTTP status code hint for API responses
 * - message: human-readable error description
 * - cause: optional original error for debugging
 */
export class PipelineStepError extends Error {
  constructor(
    public readonly stepName: string,
    public readonly code: string,
    public readonly statusCode: number,
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = 'PipelineStepError';
    
    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PipelineStepError);
    }
  }
}
