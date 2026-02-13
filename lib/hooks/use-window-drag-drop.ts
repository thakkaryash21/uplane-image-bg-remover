import { useState, useEffect } from "react";

interface UseWindowDragDropProps {
  onFileDrop: (file: File) => void;
  onInvalidType?: () => void;
}

export function useWindowDragDrop({
  onFileDrop,
  onInvalidType,
}: UseWindowDragDropProps) {
  const [isDraggingOverWindow, setIsDraggingOverWindow] = useState(false);

  useEffect(() => {
    let dragCounter = 0;

    const handleWindowDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter++;
      if (dragCounter === 1) {
        setIsDraggingOverWindow(true);
      }
    };

    const handleWindowDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter === 0) {
        setIsDraggingOverWindow(false);
      }
    };

    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter = 0;
      setIsDraggingOverWindow(false);

      const file = e.dataTransfer?.files?.[0];
      if (file) {
        // Simple client-side check for image type
        if (!file.type.startsWith("image/")) {
          onInvalidType?.();
          return;
        }

        onFileDrop(file);
      }
    };

    window.addEventListener("dragenter", handleWindowDragEnter);
    window.addEventListener("dragleave", handleWindowDragLeave);
    window.addEventListener("dragover", handleWindowDragOver);
    window.addEventListener("drop", handleWindowDrop);

    return () => {
      window.removeEventListener("dragenter", handleWindowDragEnter);
      window.removeEventListener("dragleave", handleWindowDragLeave);
      window.removeEventListener("dragover", handleWindowDragOver);
      window.removeEventListener("drop", handleWindowDrop);
    };
  }, [onFileDrop, onInvalidType]);

  return { isDraggingOverWindow };
}
