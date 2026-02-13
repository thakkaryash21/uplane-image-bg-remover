import { prisma } from '@/lib/prisma';
import { ConversionRepository } from '@/lib/services/conversion.repository';

/**
 * Merge a guest user into an authenticated user
 * 
 * This function is called when a user who has been using the app as a guest
 * signs in with an OAuth provider. All of the guest user's conversions are
 * reassigned to the authenticated user, and the orphaned guest user record
 * is deleted.
 * 
 * Executes as a Prisma interactive transaction to ensure atomicity.
 * 
 * @param guestUserId - UUID of the guest user
 * @param authenticatedUserId - UUID of the authenticated user
 */
export async function mergeGuestUser(
  guestUserId: string,
  authenticatedUserId: string
): Promise<void> {
  try {
    await prisma.$transaction(async (tx) => {
      // Step 1: Reassign all conversions from guest to authenticated user
      // Use ConversionRepository with transaction client to avoid code duplication
      const conversionRepo = new ConversionRepository(tx);
      await conversionRepo.reassignUser(guestUserId, authenticatedUserId);
      
      // Step 2: Delete the orphaned guest user record
      // This will fail if the user doesn't exist, which is fine - just means
      // the cookie was stale
      await tx.user.delete({
        where: { id: guestUserId, isGuest: true },
      });
    });
    
    console.log(`Successfully merged guest user ${guestUserId} into ${authenticatedUserId}`);
  } catch (error) {
    // If the guest user doesn't exist (stale cookie), just log and continue
    if ((error as any)?.code === 'P2025') {
      console.warn(`Guest user ${guestUserId} not found during merge - cookie was stale`);
      return;
    }
    
    // For other errors, rethrow
    throw new Error(
      `Failed to merge guest user: ${(error as Error).message}`,
      { cause: error }
    );
  }
}
