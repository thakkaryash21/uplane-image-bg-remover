import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { ConversionRepository } from '@/lib/services/conversion.repository';
import { VercelBlobStorageService } from '@/lib/services/storage/vercel-blob.service';
import { resolveUser } from '@/lib/auth/resolve-user';
import { mergeGuestUser } from '@/lib/auth/merge-guest';
import { toProcessedImage } from '@/lib/types/image';

/**
 * GET /api/images/[id]
 * 
 * Retrieves metadata for a processed image by its ID.
 * Returns the proxy URL, original filename, size, and creation timestamp.
 * 
 * Authentication required: User must be authenticated (session or guest cookie)
 * Authorization: User must own the image (userId matches)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return errorResponse(
        'Image ID is required',
        'ID_REQUIRED',
        400
      );
    }

    // Resolve user authentication
    let user = await resolveUser(request);
    
    // Handle merge if authenticated user has a guest cookie
    if (user?.guestUserId) {
      await mergeGuestUser(user.guestUserId, user.userId);
      user = { userId: user.userId, isGuest: false };
    }
    
    // Require authentication
    if (!user) {
      return errorResponse(
        'Authentication required',
        'UNAUTHORIZED',
        401
      );
    }

    // Query conversion from database
    const conversionRepo = new ConversionRepository();
    const conversion = await conversionRepo.findById(id);

    if (!conversion) {
      return errorResponse(
        'Image not found',
        'NOT_FOUND',
        404
      );
    }

    // Verify ownership
    if (conversion.userId !== user.userId) {
      return errorResponse(
        'You do not have permission to access this image',
        'FORBIDDEN',
        403
      );
    }

    // Return processed image metadata with proxy URL
    const processedImage = toProcessedImage(conversion);
    return successResponse(processedImage);
  } catch (error) {
    console.error('Error retrieving image:', error);
    return errorResponse(
      'Failed to retrieve image',
      'RETRIEVAL_ERROR',
      500
    );
  }
}

/**
 * DELETE /api/images/[id]
 * 
 * Deletes a processed image and its metadata from both blob storage and database.
 * Verifies the image exists and the user owns it before attempting deletion.
 * 
 * Authentication required: User must be authenticated (session or guest cookie)
 * Authorization: User must own the image (userId matches)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return errorResponse(
        'Image ID is required',
        'ID_REQUIRED',
        400
      );
    }

    // Resolve user authentication
    let user = await resolveUser(request);
    
    // Handle merge if authenticated user has a guest cookie
    if (user?.guestUserId) {
      await mergeGuestUser(user.guestUserId, user.userId);
      user = { userId: user.userId, isGuest: false };
    }
    
    // Require authentication
    if (!user) {
      return errorResponse(
        'Authentication required',
        'UNAUTHORIZED',
        401
      );
    }

    // Query conversion from database
    const conversionRepo = new ConversionRepository();
    const conversion = await conversionRepo.findById(id);
    
    if (!conversion) {
      return errorResponse(
        'Image not found',
        'NOT_FOUND',
        404
      );
    }

    // Verify ownership
    if (conversion.userId !== user.userId) {
      return errorResponse(
        'You do not have permission to delete this image',
        'FORBIDDEN',
        403
      );
    }

    // Delete blob from storage
    const blobService = new VercelBlobStorageService();
    await blobService.delete(conversion.blobUrl);

    // Delete conversion record from database
    await conversionRepo.deleteById(id);

    return successResponse({
      message: 'Image deleted successfully',
      id,
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    return errorResponse(
      'Failed to delete image',
      'DELETION_ERROR',
      500
    );
  }
}
