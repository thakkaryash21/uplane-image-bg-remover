import { NextRequest } from 'next/server';
import { resolveUser } from '@/lib/auth/resolve-user';
import { conversionRepository } from '@/lib/services/conversion.repository';
import { toProcessedImage } from '@/lib/types/image';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { clearGuestCookie } from '@/lib/auth/guest';

/**
 * GET /api/images
 *
 * Retrieves all processed images for the authenticated user.
 * Returns an array of ProcessedImage metadata with proxy URLs.
 *
 * Authentication required: User must be authenticated (session or guest cookie)
 */
export async function GET(request: NextRequest) {
  try {
    // Resolve user (handles merge transparently if needed)
    const user = await resolveUser(request);

    if (!user) {
      return errorResponse(
        'Authentication required',
        'UNAUTHORIZED',
        401
      );
    }

    // Fetch all conversions for this user
    const conversions = await conversionRepository.findByUserId(user.userId);

    // Map to API response format
    const images = conversions.map(toProcessedImage);

    const response = successResponse(images);

    // Clear guest cookie if merge happened
    if (user.shouldClearGuestCookie) {
      clearGuestCookie(response);
    }

    return response;
  } catch (error) {
    console.error('Error listing images:', error);
    return errorResponse(
      'Failed to retrieve images',
      'LIST_ERROR',
      500
    );
  }
}
