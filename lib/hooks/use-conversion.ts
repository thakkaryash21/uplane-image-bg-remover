import { useState, useEffect, useCallback } from "react";
import type { ProcessedImage } from "@/lib/types/image";
import type { ApiResponse } from "@/lib/types/api";

interface UseConversionOptions {
  /** When provided, skips the initial fetch and uses this data. Used when conversion is already available from list or upload. */
  initialData?: ProcessedImage | null;
}

interface UseConversionResult {
  conversion: ProcessedImage | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  rename: (newName: string) => Promise<void>;
}

export function useConversion(
  id: string,
  options?: UseConversionOptions
): UseConversionResult {
  const { initialData } = options ?? {};
  const [conversion, setConversion] = useState<ProcessedImage | null>(
    initialData ?? null
  );
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  const fetchConversion = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/conversions/${id}`);
      if (!response.ok) throw new Error("Failed to load conversion");
      const data: ApiResponse<ProcessedImage> = await response.json();
      if (data.success) {
        setConversion(data.data);
      } else {
        setError(data.error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (initialData && initialData.id === id) {
      setConversion(initialData);
      setIsLoading(false);
      return;
    }
    fetchConversion();
  }, [id, initialData, fetchConversion]);

  const rename = useCallback(
    async (newName: string) => {
      if (!id) return;
      const response = await fetch(`/api/conversions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (!response.ok) {
        const data: ApiResponse<never> = await response.json();
        throw new Error(
          data.success === false ? data.error.message : "Failed to rename"
        );
      }
      await fetchConversion();
    },
    [id, fetchConversion]
  );

  return { conversion, isLoading, error, refetch: fetchConversion, rename };
}
