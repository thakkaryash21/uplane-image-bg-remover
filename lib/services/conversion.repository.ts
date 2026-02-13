import { prisma } from '@/lib/prisma';
import type { Conversion, PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';

/**
 * Prisma transaction client type
 */
type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

/**
 * Repository for Conversion entity
 * 
 * Handles all database operations for image conversion records.
 * Conversions link users to their processed images stored in blob storage.
 * 
 * Supports optional transaction client for use within Prisma transactions.
 */
export class ConversionRepository {
  private db: PrismaClient | TransactionClient;

  /**
   * Create a new ConversionRepository
   * 
   * @param transactionClient - Optional Prisma transaction client. If provided,
   *                            all operations use this transaction. Otherwise,
   *                            operations use the global prisma instance.
   */
  constructor(transactionClient?: TransactionClient) {
    this.db = transactionClient || prisma;
  }
  /**
   * Create a new conversion record
   * 
   * @param data - Conversion data (userId, processedBlobUrl, originalBlobUrl, name, size, processedContentType, originalContentType)
   * @returns Created conversion record
   */
  async create(data: {
    userId: string;
    processedBlobUrl: string;
    originalBlobUrl: string;
    name: string;
    size: number;
    processedContentType: string;
    originalContentType: string;
  }): Promise<Conversion> {
    return await this.db.conversion.create({
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
    return await this.db.conversion.findUnique({
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
    return await this.db.conversion.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update the display name of a conversion
   *
   * @param id - Conversion UUID
   * @param name - New display name (full filename with extension)
   * @returns Updated conversion record
   */
  async updateName(id: string, name: string): Promise<Conversion> {
    return await this.db.conversion.update({
      where: { id },
      data: { name },
    });
  }

  /**
   * Delete a conversion by ID
   * 
   * @param id - Conversion UUID
   * @throws If conversion not found
   */
  async deleteById(id: string): Promise<void> {
    await this.db.conversion.delete({
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
    const result = await this.db.conversion.updateMany({
      where: { userId: fromUserId },
      data: { userId: toUserId },
    });
    
    return result.count;
  }
}

/**
 * Module-level singleton instance for use across the application
 */
export const conversionRepository = new ConversionRepository();
