import { NextRequest } from 'next/server';
import { serveImageProxy } from '@/lib/utils/image-proxy';

/**
 * GET /api/conversions/[id]/original
 *
 * Original image proxy route - serves the original uploaded image through authentication.
 *
 * This route enforces authentication and ownership checks before serving
 * the original image content. The actual Vercel Blob URL is never exposed to the
 * client - all image access goes through this authenticated proxy.
 *
 * Flow:
 * 1. Authenticate user (NextAuth session or guest cookie)
 * 2. Trigger merge if both session + guest cookie exist
 * 3. Query conversion record from DB
 * 4. Verify ownership (userId matches)
 * 5. Fetch original blob content from Vercel Blob server-side
 * 6. Stream image bytes to client with appropriate headers
 *
 * Cache headers ensure browsers can cache locally but CDNs won't cache
 * authenticated content (Cache-Control: private).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  return serveImageProxy(request, id, {
    getBlobUrl: (conversion) => conversion.originalBlobUrl,
    getContentType: (conversion) => conversion.originalContentType,
    getContentLength: (_, buffer) => buffer.length,
    errorContext: 'Error serving original image file',
  });
}
