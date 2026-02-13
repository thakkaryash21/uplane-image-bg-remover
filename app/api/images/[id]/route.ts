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
 * PATCH /api/images/[id]
 *
 * Updates the display name of a conversion.
 *
 * Authentication required: User must be authenticated (session or guest cookie)
 * Authorization: User must own the image (userId matches)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authResult = await authorizeConversionAccess(request, id);
    if (!authResult.authorized) {
      return authResult.response;
    }

    let body: { name?: string };
    try {
      body = await request.json();
    } catch {
      return errorResponse('Invalid JSON body', 'INVALID_BODY', 400);
    }

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return errorResponse('Name is required and cannot be empty', 'NAME_REQUIRED', 400);
    }

    const MAX_NAME_LENGTH = 255;
    if (name.length > MAX_NAME_LENGTH) {
      return errorResponse(`Name must be at most ${MAX_NAME_LENGTH} characters`, 'NAME_TOO_LONG', 400);
    }

    const conversion = await conversionRepository.updateName(id, name);
    const processedImage = toProcessedImage(conversion);
    const response = successResponse(processedImage);

    return maybeClearGuestCookie(response, authResult.shouldClearGuestCookie);
  } catch (error) {
    console.error('Error updating image name:', error);
    return errorResponse('Failed to update image name', 'UPDATE_ERROR', 500);
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
