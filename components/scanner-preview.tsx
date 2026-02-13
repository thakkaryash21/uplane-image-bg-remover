"use client";

import { useEffect, useState } from "react";

interface ScannerPreviewProps {
  file: File;
}

export default function ScannerPreview({ file }: ScannerPreviewProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;

    const url = URL.createObjectURL(file);
    setImageUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  if (!imageUrl) return null;

  return (
    <div className="relative w-fit max-w-full mx-auto rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-inner">
      {/* Original Image */}
      <img
        src={imageUrl}
        alt="Processing..."
        className="block max-w-full max-h-[28rem] w-auto h-auto object-contain"
      />

      {/* Scanner Overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
        <div className="absolute inset-0 bg-primary-500/10 mix-blend-overlay" />
        {/* Scanning Line */}
        <div className="absolute top-0 bottom-0 w-1 bg-primary-500 shadow-[0_0_15px_rgba(14,165,233,0.8)] animate-scan" />
      </div>
    </div>
  );
}
