import { IImageProcessingStep } from '../image-processing-step';
import { PipelineStepError } from '../pipeline-step-error';

/**
 * Pipeline step that removes image backgrounds using the Remove.bg API.
 * 
 * Features:
 * - Automatic retries for transient failures (network issues, 5xx errors)
 * - Detailed error mapping for different failure scenarios
 * - Self-contained error handling - all failures converted to PipelineStepError
 */
export class BackgroundRemovalStep implements IImageProcessingStep {
  readonly name = 'background-removal';
  
  private readonly apiKey: string;
  private readonly apiUrl = 'https://api.remove.bg/v1.0/removebg';
  private readonly maxRetries = 2;
  private readonly retryDelayMs = 1000;

  constructor() {
    this.apiKey = process.env.REMOVEBG_API_KEY || '';
    
    if (!this.apiKey) {
      throw new Error(
        'REMOVEBG_API_KEY environment variable is required for BackgroundRemovalStep'
      );
    }
  }

  async process(image: Buffer): Promise<Buffer> {
    let lastError: Error | null = null;
    
    // Retry logic for transient failures
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.removeBackground(image);
      } catch (error) {
        lastError = error as Error;
        
        // If it's already a PipelineStepError, check if it's retryable
        if (error instanceof PipelineStepError) {
          const isRetryable = this.isRetryableError(error);
          
          if (!isRetryable || attempt === this.maxRetries) {
            throw error;
          }
          
          // Wait before retrying
          await this.sleep(this.retryDelayMs * (attempt + 1));
          continue;
        }
        
        // Unexpected error - convert and throw
        throw new PipelineStepError(
          this.name,
          'BG_REMOVAL_UNEXPECTED_ERROR',
          500,
          'An unexpected error occurred during background removal',
          { cause: error }
        );
      }
    }
    
    // Should never reach here due to throw in loop, but TypeScript doesn't know that
    throw new PipelineStepError(
      this.name,
      'BG_REMOVAL_FAILED',
      500,
      'Background removal failed after retries',
      { cause: lastError || undefined }
    );
  }

  private async removeBackground(image: Buffer): Promise<Buffer> {
    try {
      const formData = new FormData();
      // Convert Buffer to Blob properly for FormData
      const blob = new Blob([new Uint8Array(image)], { type: 'image/png' });
      formData.append('image_file', blob, 'image.png');
      formData.append('size', 'auto');

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'X-Api-Key': this.apiKey,
        },
        body: formData,
      });

      // Handle error responses
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      // If it's already a PipelineStepError, re-throw
      if (error instanceof PipelineStepError) {
        throw error;
      }
      
      // Network or other fetch errors
      throw new PipelineStepError(
        this.name,
        'BG_REMOVAL_NETWORK_ERROR',
        502,
        'Failed to connect to background removal service',
        { cause: error as Error }
      );
    }
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    let errorDetails: any;
    
    try {
      errorDetails = await response.json();
    } catch {
      errorDetails = { errors: [{ title: 'Unknown error' }] };
    }

    const errorMessage = errorDetails.errors?.[0]?.title || 'Background removal failed';

    switch (response.status) {
      case 400:
        throw new PipelineStepError(
          this.name,
          'BG_REMOVAL_INVALID_IMAGE',
          400,
          `Invalid image: ${errorMessage}`
        );
      
      case 402:
      case 403:
        throw new PipelineStepError(
          this.name,
          'BG_REMOVAL_QUOTA_EXCEEDED',
          502,
          'Background removal quota exceeded or insufficient credits'
        );
      
      case 429:
        throw new PipelineStepError(
          this.name,
          'BG_REMOVAL_RATE_LIMITED',
          502,
          'Too many requests to background removal service'
        );
      
      case 500:
      case 502:
      case 503:
      case 504:
        throw new PipelineStepError(
          this.name,
          'BG_REMOVAL_SERVICE_UNAVAILABLE',
          502,
          'Background removal service is temporarily unavailable'
        );
      
      default:
        throw new PipelineStepError(
          this.name,
          'BG_REMOVAL_FAILED',
          502,
          `Background removal failed: ${errorMessage}`
        );
    }
  }

  private isRetryableError(error: PipelineStepError): boolean {
    const retryableCodes = [
      'BG_REMOVAL_NETWORK_ERROR',
      'BG_REMOVAL_SERVICE_UNAVAILABLE',
      'BG_REMOVAL_RATE_LIMITED',
    ];
    
    return retryableCodes.includes(error.code);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
