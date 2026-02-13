import sharp from 'sharp';
import { IImageProcessingStep } from '../image-processing-step';
import { PipelineStepError } from '../pipeline-step-error';

/**
 * Pipeline step that converts any Sharp-supported input format to PNG.
 * Ensures Remove.bg (JPG/PNG/WebP only) and subsequent steps receive a
 * consistent format. Input formats: JPEG, PNG, WebP, GIF, AVIF, TIFF, SVG, HEIC.
 */
export class FormatNormalizationStep implements IImageProcessingStep {
  readonly name = 'format-normalization';

  async process(image: Buffer): Promise<Buffer> {
    try {
      return await sharp(image).png().toBuffer();
    } catch (error) {
      throw new PipelineStepError(
        this.name,
        'NORMALIZATION_FAILED',
        400,
        'Unsupported or corrupted image format',
        { cause: error as Error }
      );
    }
  }
}
