import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/utils/api-response";
import { blobStorageService } from "@/lib/services/storage/vercel-blob.service";
import {
  authorizeConversionAccess,
  maybeClearGuestCookie,
} from "@/lib/utils/authorize-conversion";
import type { Conversion } from "@prisma/client";

/**
 * Configuration for serving an image through the authenticated proxy
 */
interface ImageProxyConfig {
  /** Function to extract the blob URL from the conversion record */
  getBlobUrl: (conversion: Conversion) => string;
  /** Function to extract the content type from the conversion record */
  getContentType: (conversion: Conversion) => string;
  /** Function to calculate content length (from conversion or buffer) */
  getContentLength: (conversion: Conversion, buffer: Buffer) => number;
  /** Error message prefix for logging */
  errorContext: string;
}

/**
 * Shared authenticated image proxy handler
 *
 * This function encapsulates the common logic for serving images through an authenticated proxy:
 * 1. Authenticate user (handles merge transparently via authorizeConversionAccess)
 * 2. Query conversion record and verify ownership
 * 3. Fetch blob content from Vercel Blob server-side
 * 4. Stream image bytes to client with appropriate headers
 *
 * @param request - The incoming request
 * @param id - The conversion/image ID
 * @param config - Configuration specifying which blob to serve and how
 * @returns NextResponse with image data or error
 */
export async function serveImageProxy(
  request: NextRequest,
  id: string,
  config: ImageProxyConfig,
): Promise<NextResponse> {
  try {
    // Authorize access (handles user resolution, merge, ownership check)
    const authResult = await authorizeConversionAccess(request, id);

    if (!authResult.authorized) {
      return authResult.response;
    }

    // Fetch blob content from storage using config
    const blobUrl = config.getBlobUrl(authResult.conversion);
    const imageBuffer = await blobStorageService.fetchBlob(blobUrl);

    // Create response with image data
    const response = new NextResponse(new Uint8Array(imageBuffer), {
      status: 200,
      headers: {
        "Content-Type": config.getContentType(authResult.conversion),
        "Content-Length": config
          .getContentLength(authResult.conversion, imageBuffer)
          .toString(),
        // Cache locally but not on CDN (private content)
        "Cache-Control": "private, max-age=3600",
        // Optional: Add filename for downloads
        "Content-Disposition": `inline; filename="${authResult.conversion.name}"`,
      },
    });

    // Clear guest cookie if merge happened
    return maybeClearGuestCookie(response, authResult.shouldClearGuestCookie);
  } catch (error) {
    console.error(`${config.errorContext}:`, error);

    // Return JSON error response
    return errorResponse(
      "Failed to retrieve image file",
      "FILE_RETRIEVAL_ERROR",
      500,
    );
  }
}
