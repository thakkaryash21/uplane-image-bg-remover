import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { VercelBlobStorageService } from '@/lib/services/storage/vercel-blob.service';

/**
 * GET /api/images/[id]
 * 
 * Retrieves metadata for a processed image by its ID.
 * Returns the image URL, original filename, size, and creation timestamp.
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

    const storageService = new VercelBlobStorageService();
    const image = await storageService.getById(id);

    if (!image) {
      return errorResponse(
        'Image not found',
        'NOT_FOUND',
        404
      );
    }

    return successResponse(image);
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
 * Deletes a processed image and its metadata from storage.
 * Verifies the image exists before attempting deletion.
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

    const storageService = new VercelBlobStorageService();
    
    // Verify image exists before deletion
    const image = await storageService.getById(id);
    if (!image) {
      return errorResponse(
        'Image not found',
        'NOT_FOUND',
        404
      );
    }

    // Delete the image
    await storageService.deleteById(id);

    return successResponse({
      message: 'Image deleted successfully',
      id,
    });
  } catch (error) {
    // Handle "not found" errors specifically
    if (error instanceof Error && error.message.includes('not found')) {
      return errorResponse(
        'Image not found',
        'NOT_FOUND',
        404
      );
    }

    console.error('Error deleting image:', error);
    return errorResponse(
      'Failed to delete image',
      'DELETION_ERROR',
      500
    );
  }
}
