/**
 * Pure blob storage interface
 * 
 * Handles file upload/download/deletion without any metadata management.
 * Metadata is managed separately in the database via ConversionRepository.
 */
export interface IBlobStorageService {
  /**
   * Upload a file buffer to blob storage
   * 
   * @param buffer - File buffer to upload
   * @param pathname - Path in blob storage (e.g., "images/uuid/filename.png")
   * @param contentType - MIME type of the file
   * @returns Object containing the public blob URL and file size
   */
  upload(
    buffer: Buffer,
    pathname: string,
    contentType: string
  ): Promise<{ url: string; size: number }>;

  /**
   * Fetch blob content from storage by URL
   * 
   * Used by the image proxy route to serve authenticated image content.
   * 
   * @param url - Full blob URL to fetch
   * @returns Buffer containing the blob content
   */
  fetchBlob(url: string): Promise<Buffer>;

  /**
   * Delete a blob from storage by URL
   * 
   * @param url - Full blob URL to delete
   */
  delete(url: string): Promise<void>;
}
