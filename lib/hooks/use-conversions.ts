import { useState, useEffect, useCallback } from "react";
import type { ProcessedImage } from "@/lib/types/image";
import type { ApiResponse } from "@/lib/types/api";

interface UseConversionsResult {
  conversions: ProcessedImage[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  deleteConversion: (id: string) => Promise<void>;
}

/**
 * Custom hook to manage image conversions
 * Fetches the list of conversions from GET /api/images
 * Handles 401 gracefully (unauthenticated/guest with no uploads yet)
 */
export function useConversions(): UseConversionsResult {
  const [conversions, setConversions] = useState<ProcessedImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/images");

      // Handle 401 - unauthenticated/guest user with no uploads yet
      // This is not an error state, just an empty list
      if (response.status === 401) {
        setConversions([]);
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch conversions");
      }

      const data: ApiResponse<ProcessedImage[]> = await response.json();

      if (data.success) {
        setConversions(data.data);
      } else {
        setError(data.error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteConversion = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/images/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const data: ApiResponse<never> = await response.json();
          throw new Error(
            data.success === false
              ? data.error.message
              : "Failed to delete conversion",
          );
        }

        // Refetch the list after successful deletion
        await fetchConversions();
      } catch (err) {
        throw err;
      }
    },
    [fetchConversions],
  );

  useEffect(() => {
    fetchConversions();
  }, [fetchConversions]);

  return {
    conversions,
    isLoading,
    error,
    refetch: fetchConversions,
    deleteConversion,
  };
}
