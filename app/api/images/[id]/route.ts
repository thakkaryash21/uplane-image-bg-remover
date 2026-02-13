import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { conversionRepository } from '@/lib/services/conversion.repository';
import { blobStorageService } from '@/lib/services/storage/vercel-blob.service';
import { authorizeConversionAccess, maybeClearGuestCookie } from '@/lib/utils/authorize-conversion';
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
    
    // Authorize access (handles user resolution, merge, ownership check)
    const authResult = await authorizeConversionAccess(request, id);
    
    if (!authResult.authorized) {
      return authResult.response;
    }

    // Return processed image metadata with proxy URL
    const processedImage = toProcessedImage(authResult.conversion);
    const response = successResponse(processedImage);
    
    // Clear guest cookie if merge happened
    return maybeClearGuestCookie(response, authResult.shouldClearGuestCookie);
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
 * Deletes both original and processed images and their metadata from blob storage and database.
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
    
    // Authorize access (handles user resolution, merge, ownership check)
    const authResult = await authorizeConversionAccess(request, id);
    
    if (!authResult.authorized) {
      return authResult.response;
    }

    // Delete both blobs from storage
    await blobStorageService.delete(authResult.conversion.processedBlobUrl);
    await blobStorageService.delete(authResult.conversion.originalBlobUrl);

    // Delete conversion record from database
    await conversionRepository.deleteById(id);

    const response = successResponse({
      message: 'Image deleted successfully',
      id,
    });
    
    // Clear guest cookie if merge happened
    return maybeClearGuestCookie(response, authResult.shouldClearGuestCookie);
  } catch (error) {
    console.error('Error deleting image:', error);
    return errorResponse(
      'Failed to delete image',
      'DELETION_ERROR',
      500
    );
  }
}
