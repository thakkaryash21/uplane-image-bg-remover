import { NextRequest } from 'next/server';
import { validateImageFile } from '@/lib/utils/validation';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { ImageProcessingPipeline } from '@/lib/pipeline/image-processing-pipeline';
import { FormatNormalizationStep } from '@/lib/pipeline/steps/format-normalization.step';
import { BackgroundRemovalStep } from '@/lib/pipeline/steps/background-removal.step';
import { HorizontalFlipStep } from '@/lib/pipeline/steps/horizontal-flip.step';
import { blobStorageService } from '@/lib/services/storage/vercel-blob.service';
import { BlobStorageError } from '@/lib/services/storage/blob-storage-error';
import { conversionRepository } from '@/lib/services/conversion.repository';
import { PipelineStepError } from '@/lib/pipeline/pipeline-step-error';
import { resolveUser } from '@/lib/auth/resolve-user';
import { createGuestUser, setGuestCookie, clearGuestCookie } from '@/lib/auth/guest';
import { toProcessedImage } from '@/lib/types/image';

/**
 * POST /api/upload
 * 
 * Handles image upload, processing (background removal + horizontal flip),
 * and storage. Returns the processed image URL and metadata.
 * 
 * Authentication:
 * - Authenticated users: Use NextAuth session userId
 * - Guest users: Use guest cookie userId
 * - New users: Create guest user in DB and set guest cookie
 * - Guest upgrading to authenticated: Merge happens automatically in resolveUser
 * 
 * Flow:
 * 1. Resolve user (handles merge transparently if both session + guest cookie exist)
 * 2. If no user, create new guest user
 * 3. Validate uploaded file (type, size)
 * 4. Store original image in Vercel Blob
 * 5. Run processing pipeline (remove background -> flip horizontally)
 * 6. Store processed image in Vercel Blob
 * 7. Create Conversion record in DB with both blob URLs
 * 8. Return image metadata with proxy URLs (processed + original)
 * 9. Clear guest cookie if merge happened, or set guest cookie if new guest created
 */
export async function POST(request: NextRequest) {
  try {
    // Resolve user (handles merge transparently)
    let user = await resolveUser(request);
    let newGuestToken: string | null = null;
    
    // If no user at all, create a new guest user
    if (!user) {
      const guest = await createGuestUser();
      newGuestToken = guest.token;
      user = { 
        userId: guest.userId, 
        isGuest: true,
        shouldClearGuestCookie: false 
      };
    }
    
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

    // Generate UUID for this conversion
    const { randomUUID } = await import('crypto');
    const conversionId = randomUUID();
    const cleanFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');

    // Store original image in blob storage (before processing)
    const originalBlobPath = `originals/${conversionId}/${cleanFilename}`;
    const { url: originalBlobUrl } = await blobStorageService.upload(
      imageBuffer,
      originalBlobPath,
      file.type
    );

    // Initialize and execute processing pipeline
    const pipeline = new ImageProcessingPipeline([
      new FormatNormalizationStep(),
      new BackgroundRemovalStep(),
      new HorizontalFlipStep(),
    ]);
    const processedBuffer = await pipeline.execute(imageBuffer);

    // Store processed image in blob storage
    const processedBlobPath = `images/${conversionId}/${cleanFilename}.png`;
    const { url: processedBlobUrl, size } = await blobStorageService.upload(
      processedBuffer,
      processedBlobPath,
      'image/png'
    );

    // Create conversion record in database
    const conversion = await conversionRepository.create({
      userId: user.userId,
      processedBlobUrl,
      originalBlobUrl,
      originalName: file.name,
      size,
      processedContentType: 'image/png',
      originalContentType: file.type,
    });

    // Create response with proxy URL
    const processedImage = toProcessedImage(conversion);
    const response = successResponse(processedImage, 201);

    // Handle cookie management
    if (user.shouldClearGuestCookie) {
      // Merge happened - clear guest cookie
      clearGuestCookie(response);
    } else if (newGuestToken) {
      // New guest was created - set guest cookie
      setGuestCookie(response, newGuestToken);
    }

    return response;
  } catch (error) {
    // Handle PipelineStepError with detailed context
    if (error instanceof PipelineStepError) {
      return errorResponse(
        error.message,
        error.code,
        error.statusCode
      );
    }

    // Handle blob storage errors
    if (error instanceof BlobStorageError) {
      return errorResponse(
        'Failed to store image',
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
