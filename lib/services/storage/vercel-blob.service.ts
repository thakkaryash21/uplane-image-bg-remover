import { put, del } from '@vercel/blob';
import type { IBlobStorageService } from './blob-storage.interface';
import { BlobStorageError } from './blob-storage-error';

/**
 * Vercel Blob storage implementation
 * 
 * Provides file upload/download/delete operations using Vercel Blob.
 * Does NOT manage metadata - that's the database's responsibility.
 */
export class VercelBlobStorageService implements IBlobStorageService {
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
    pathname: string,
    contentType: string
  ): Promise<{ url: string; size: number }> {
    try {
      const blob = await put(pathname, buffer, {
        access: 'public',
        contentType,
      });

      return {
        url: blob.url,
        size: buffer.length,
      };
    } catch (error) {
      throw new BlobStorageError(
        'upload',
        `Failed to upload file to blob storage: ${(error as Error).message}`,
        { cause: error }
      );
    }
  }

  async fetchBlob(url: string): Promise<Buffer> {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch blob: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      throw new BlobStorageError(
        'fetch',
        `Failed to fetch blob from storage: ${(error as Error).message}`,
        { cause: error }
      );
    }
  }

  async delete(url: string): Promise<void> {
    try {
      await del(url);
    } catch (error) {
      throw new BlobStorageError(
        'delete',
        `Failed to delete blob from storage: ${(error as Error).message}`,
        { cause: error }
      );
    }
  }
}

/**
 * Module-level singleton instance for use across the application
 */
export const blobStorageService = new VercelBlobStorageService();
