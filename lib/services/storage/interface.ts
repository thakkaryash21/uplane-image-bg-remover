import type { ProcessedImage } from '@/lib/types/image';

/**
 * Interface for cloud storage operations.
 * 
 * Abstracts the underlying storage implementation (Vercel Blob, S3, etc.)
 * to allow easy swapping of providers.
 */
export interface IStorageService {
  /**
   * Upload a processed image to cloud storage.
   * 
   * @param buffer - Image buffer to upload
   * @param filename - Original filename for reference
   * @param contentType - MIME type of the image
   * @returns Metadata about the uploaded image including public URL
   */
  upload(
    buffer: Buffer,
    filename: string,
    contentType: string
  ): Promise<ProcessedImage>;

  /**
   * Retrieve image metadata by ID.
   * 
   * @param id - Unique image identifier
   * @returns Image metadata if found, null otherwise
   */
  getById(id: string): Promise<ProcessedImage | null>;

  /**
   * Delete an image from storage by ID.
   * 
   * @param id - Unique image identifier
   * @throws If image not found or deletion fails
   */
  deleteById(id: string): Promise<void>;
}
