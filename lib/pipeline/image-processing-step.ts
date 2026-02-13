/**
 * Interface for all image processing pipeline steps.
 * 
 * Each step must implement a uniform Buffer -> Buffer transformation.
 * On success, returns the processed image buffer.
 * On failure, throws a PipelineStepError with detailed context.
 */
export interface IImageProcessingStep {
  /** Human-readable step name for logging and error reporting */
  readonly name: string;
  
  /**
   * Process an image buffer and return the transformed result.
   * 
   * @param image - Input image as Buffer
   * @returns Processed image as Buffer
   * @throws {PipelineStepError} On processing failure with step context
   */
  process(image: Buffer): Promise<Buffer>;
}
