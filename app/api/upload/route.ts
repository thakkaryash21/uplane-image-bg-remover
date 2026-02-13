import { NextRequest } from 'next/server';
import { validateImageFile } from '@/lib/utils/validation';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { ImageProcessingPipeline } from '@/lib/pipeline/image-processing-pipeline';
import { BackgroundRemovalStep } from '@/lib/pipeline/steps/background-removal.step';
import { HorizontalFlipStep } from '@/lib/pipeline/steps/horizontal-flip.step';
import { VercelBlobStorageService } from '@/lib/services/storage/vercel-blob.service';
import { PipelineStepError } from '@/lib/pipeline/pipeline-step-error';

/**
 * POST /api/upload
 * 
 * Handles image upload, processing (background removal + horizontal flip),
 * and storage. Returns the processed image URL and metadata.
 * 
 * Flow:
 * 1. Validate uploaded file (type, size)
 * 2. Run processing pipeline (remove background -> flip horizontally)
 * 3. Store processed image in Vercel Blob
 * 4. Return image metadata with public URL
 */
export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return errorResponse(
        'No file provided in request',
        'FILE_REQUIRED',
        400
      );
    }

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return errorResponse(
        validation.error,
        'INVALID_FILE',
        400
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // Initialize processing pipeline
    const pipeline = new ImageProcessingPipeline([
      new BackgroundRemovalStep(),
      new HorizontalFlipStep(),
    ]);

    // Execute pipeline
    const processedBuffer = await pipeline.execute(imageBuffer);

    // Store processed image
    const storageService = new VercelBlobStorageService();
    const processedImage = await storageService.upload(
      processedBuffer,
      file.name,
      'image/png'
    );

    return successResponse(processedImage, 201);
  } catch (error) {
    // Handle PipelineStepError with detailed context
    if (error instanceof PipelineStepError) {
      return errorResponse(
        error.message,
        error.code,
        error.statusCode
      );
    }

    // Handle storage errors
    if (error instanceof Error && error.message.includes('storage')) {
      return errorResponse(
        'Failed to store processed image',
        'STORAGE_ERROR',
        500
      );
    }

    // Handle unexpected errors
    console.error('Unexpected error in upload route:', error);
    return errorResponse(
      'An unexpected error occurred while processing your image',
      'INTERNAL_ERROR',
      500
    );
  }
}
