import { put, list, del } from '@vercel/blob';
import { randomUUID } from 'crypto';
import type { IStorageService } from './interface';
import type { ProcessedImage } from '@/lib/types/image';

/**
 * Vercel Blob storage implementation.
 * 
 * Stores processed images in Vercel Blob with the following structure:
 * - Path: images/{uuid}/{originalFilename}.png
 * - UUID serves as the image ID for retrieval/deletion
 */
export class VercelBlobStorageService implements IStorageService {
  constructor() {
    // Verify that BLOB_READ_WRITE_TOKEN is available
    // Note: On Vercel, this is automatically set. For local dev, it must be configured.
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.warn(
        'BLOB_READ_WRITE_TOKEN not found. Vercel Blob operations may fail in local development. ' +
        'This is automatically configured on Vercel deployments.'
      );
    }
  }

  async upload(
    buffer: Buffer,
    filename: string,
    contentType: string
  ): Promise<ProcessedImage> {
    const id = randomUUID();
    
    // Clean filename to avoid path issues
    const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const pathname = `images/${id}/${cleanFilename}.png`;

    try {
      const blob = await put(pathname, buffer, {
        access: 'public',
        contentType: 'image/png', // Always PNG after processing
      });

      return {
        id,
        url: blob.url,
        originalName: filename,
        size: buffer.length,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(
        `Failed to upload image to storage: ${(error as Error).message}`,
        { cause: error }
      );
    }
  }

  async getById(id: string): Promise<ProcessedImage | null> {
    try {
      const { blobs } = await list({
        prefix: `images/${id}/`,
      });

      if (blobs.length === 0) {
        return null;
      }

      // Get the first blob (should only be one per ID)
      const blob = blobs[0];
      
      // Extract original filename from pathname
      const pathParts = blob.pathname.split('/');
      const fileNameWithExt = pathParts[pathParts.length - 1];
      const originalName = fileNameWithExt.replace('.png', '');

      return {
        id,
        url: blob.url,
        originalName,
        size: blob.size,
        createdAt: blob.uploadedAt.toISOString(),
      };
    } catch (error) {
      throw new Error(
        `Failed to retrieve image from storage: ${(error as Error).message}`,
        { cause: error }
      );
    }
  }

  async deleteById(id: string): Promise<void> {
    try {
      // First, find the blob(s) with this ID
      const { blobs } = await list({
        prefix: `images/${id}/`,
      });

      if (blobs.length === 0) {
        throw new Error(`Image with ID ${id} not found`);
      }

      // Delete all blobs with this prefix (should be just one)
      const urls = blobs.map(blob => blob.url);
      await del(urls);
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        throw error;
      }
      
      throw new Error(
        `Failed to delete image from storage: ${(error as Error).message}`,
        { cause: error }
      );
    }
  }
}
