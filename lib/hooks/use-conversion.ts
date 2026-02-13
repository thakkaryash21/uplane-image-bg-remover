import { useState, useEffect } from "react";
import type { ProcessedImage } from "@/lib/types/image";
import type { ApiResponse } from "@/lib/types/api";

interface UseConversionResult {
  conversion: ProcessedImage | null;
  isLoading: boolean;
  error: string | null;
}

export function useConversion(id: string): UseConversionResult {
  const [conversion, setConversion] = useState<ProcessedImage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConversion() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/images/${id}`);

        if (!response.ok) {
          throw new Error("Failed to load conversion");
        }

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
    }

    if (id) {
      fetchConversion();
    }
  }, [id]);

  return { conversion, isLoading, error };
}
