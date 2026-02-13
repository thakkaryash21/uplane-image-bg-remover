import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { validateImageFile } from '@/lib/utils/validation';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { ImageProcessingPipeline } from '@/lib/pipeline/image-processing-pipeline';
import { BackgroundRemovalStep } from '@/lib/pipeline/steps/background-removal.step';
import { HorizontalFlipStep } from '@/lib/pipeline/steps/horizontal-flip.step';
import { VercelBlobStorageService } from '@/lib/services/storage/vercel-blob.service';
import { ConversionRepository } from '@/lib/services/conversion.repository';
import { PipelineStepError } from '@/lib/pipeline/pipeline-step-error';
import { resolveUser } from '@/lib/auth/resolve-user';
import { createGuestCookie, setGuestCookie } from '@/lib/auth/guest';
import { mergeGuestUser } from '@/lib/auth/merge-guest';
import { toProcessedImage } from '@/lib/types/image';
import { prisma } from '@/lib/prisma';

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
 * - Guest upgrading to authenticated: Trigger merge on first authenticated request
 * 
 * Flow:
 * 1. Resolve user (auth session, guest cookie, or create new guest)
 * 2. If both session + guest cookie exist, trigger merge
 * 3. Validate uploaded file (type, size)
 * 4. Store original image in Vercel Blob
 * 5. Run processing pipeline (remove background -> flip horizontally)
 * 6. Store processed image in Vercel Blob
 * 7. Create Conversion record in DB with both blob URLs
 * 8. Return image metadata with proxy URLs (processed + original)
 */
export async function POST(request: NextRequest) {
  try {
    // Resolve user authentication
    let user = await resolveUser(request);
    let newGuestToken: string | null = null;
    
    // Handle merge if authenticated user has a guest cookie
    if (user?.guestUserId) {
      await mergeGuestUser(user.guestUserId, user.userId);
      // After merge, user is just the authenticated user (no guest cookie needed)
      user = { userId: user.userId, isGuest: false };
    }
    
    // If no user at all, create a new guest user
    if (!user) {
      const guestUserId = randomUUID();
      
      // Create guest user in database
      await prisma.user.create({
        data: {
          id: guestUserId,
          isGuest: true,
        },
      });
      
      // Generate guest cookie token
      newGuestToken = await createGuestCookie(guestUserId);
      
      user = { userId: guestUserId, isGuest: true };
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

    // Generate UUID for this conversion (shared between original and processed images)
    const conversionId = randomUUID();
    const blobService = new VercelBlobStorageService();
    const cleanFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');

    // Store original image in blob storage (before processing)
    const originalBlobPath = `originals/${conversionId}/${cleanFilename}`;
    const { url: originalBlobUrl } = await blobService.upload(
      imageBuffer,
      originalBlobPath,
      file.type
    );

    // Initialize processing pipeline
    const pipeline = new ImageProcessingPipeline([
      new BackgroundRemovalStep(),
      new HorizontalFlipStep(),
    ]);

    // Execute pipeline
    const processedBuffer = await pipeline.execute(imageBuffer);

    // Store processed image in blob storage
    const processedBlobPath = `images/${conversionId}/${cleanFilename}.png`;
    
    const { url: processedBlobUrl, size } = await blobService.upload(
      processedBuffer,
      processedBlobPath,
      'image/png'
    );

    // Create conversion record in database
    const conversionRepo = new ConversionRepository();
    const conversion = await conversionRepo.create({
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

    // If a new guest was created, set the guest cookie
    if (newGuestToken) {
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
