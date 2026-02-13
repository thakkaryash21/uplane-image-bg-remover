import type { IImageProcessingStep } from './image-processing-step';

/**
 * Orchestrates sequential execution of image processing steps.
 * 
 * The pipeline takes an ordered list of steps and executes them sequentially,
 * passing the output of each step as input to the next. If any step fails
 * by throwing a PipelineStepError, execution stops and the error bubbles up
 * to the caller with full context about which step failed.
 * 
 * The pipeline itself is intentionally minimal - all error handling, retries,
 * and recovery logic lives within the individual steps, keeping them
 * self-contained and the pipeline logic simple.
 */
export class ImageProcessingPipeline {
  constructor(private readonly steps: IImageProcessingStep[]) {
    if (steps.length === 0) {
      throw new Error('Pipeline must have at least one processing step');
    }
  }

  /**
   * Execute all pipeline steps sequentially on the input image.
   * 
   * @param image - Input image buffer to process
   * @returns Processed image buffer after all steps complete
   * @throws {PipelineStepError} If any step fails, with step context
   */
  async execute(image: Buffer): Promise<Buffer> {
    let result = image;
    
    for (const step of this.steps) {
      result = await step.process(result);
    }
    
    return result;
  }

  /**
   * Get the names of all steps in this pipeline.
   * Useful for logging and debugging.
   */
  get stepNames(): string[] {
    return this.steps.map(step => step.name);
  }
}
