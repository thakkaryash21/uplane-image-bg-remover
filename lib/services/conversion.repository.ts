import { prisma } from '@/lib/prisma';
import type { Conversion } from '@prisma/client';

/**
 * Repository for Conversion entity
 * 
 * Handles all database operations for image conversion records.
 * Conversions link users to their processed images stored in blob storage.
 */
export class ConversionRepository {
  /**
   * Create a new conversion record
   * 
   * @param data - Conversion data (userId, processedBlobUrl, originalBlobUrl, originalName, size, processedContentType, originalContentType)
   * @returns Created conversion record
   */
  async create(data: {
    userId: string;
    processedBlobUrl: string;
    originalBlobUrl: string;
    originalName: string;
    size: number;
    processedContentType: string;
    originalContentType: string;
  }): Promise<Conversion> {
    return await prisma.conversion.create({
      data,
    });
  }

  /**
   * Find a conversion by ID
   * 
   * @param id - Conversion UUID
   * @returns Conversion record or null if not found
   */
  async findById(id: string): Promise<Conversion | null> {
    return await prisma.conversion.findUnique({
      where: { id },
    });
  }

  /**
   * Find all conversions for a user
   * 
   * @param userId - User UUID
   * @returns Array of conversion records
   */
  async findByUserId(userId: string): Promise<Conversion[]> {
    return await prisma.conversion.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Delete a conversion by ID
   * 
   * @param id - Conversion UUID
   * @throws If conversion not found
   */
  async deleteById(id: string): Promise<void> {
    await prisma.conversion.delete({
      where: { id },
    });
  }

  /**
   * Reassign all conversions from one user to another
   * 
   * Used during guest-to-authenticated user merge.
   * 
   * @param fromUserId - Source user UUID (guest)
   * @param toUserId - Target user UUID (authenticated)
   * @returns Number of conversions reassigned
   */
  async reassignUser(fromUserId: string, toUserId: string): Promise<number> {
    const result = await prisma.conversion.updateMany({
      where: { userId: fromUserId },
      data: { userId: toUserId },
    });
    
    return result.count;
  }
}
