import sharp from 'sharp';
import { IImageProcessingStep } from '../image-processing-step';
import { PipelineStepError } from '../pipeline-step-error';

/**
 * Pipeline step that horizontally flips an image using sharp.
 * 
 * This is a fast, local operation that rarely fails. If sharp encounters
 * an error (corrupted image, unsupported format, etc.), it's wrapped in
 * a PipelineStepError for consistent handling.
 */
export class HorizontalFlipStep implements IImageProcessingStep {
  readonly name = 'horizontal-flip';

  async process(image: Buffer): Promise<Buffer> {
    try {
      // Use sharp's .flop() method for horizontal flip
      // Convert to PNG to ensure consistent output format
      const flippedImage = await sharp(image)
        .flop()
        .png()
        .toBuffer();

      return flippedImage;
    } catch (error) {
      throw new PipelineStepError(
        this.name,
        'FLIP_FAILED',
        500,
        'Failed to flip image horizontally',
        { cause: error as Error }
      );
    }
  }
}
