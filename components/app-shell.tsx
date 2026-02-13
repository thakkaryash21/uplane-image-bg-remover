"use client";

import { useState, useEffect, DragEvent } from "react";
import { useConversions } from "@/lib/hooks/use-conversions";
import Header from "./header";
import Sidebar from "./sidebar";
import ImageDropzone from "./image-dropzone";
import ConversionResult from "./conversion-result";

/**
 * Main app shell managing overall layout and state
 * - Header with login controls
 * - Sidebar with conversion history (drawer on mobile)
 * - Main content area (dropzone or result view)
 * - Full-page drag overlay for drop-anywhere functionality
 * - Footer
 */
export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedConversionId, setSelectedConversionId] = useState<
    string | null
  >(null);
  const [isDraggingOverWindow, setIsDraggingOverWindow] = useState(false);

  const { conversions, isLoading, deleteConversion, refetch } =
    useConversions();

  // Handle window-level drag events for full-page drop overlay
  useEffect(() => {
    let dragCounter = 0;

    const handleWindowDragEnter = (e: globalThis.DragEvent) => {
      e.preventDefault();
      dragCounter++;
      if (dragCounter === 1) {
        setIsDraggingOverWindow(true);
      }
    };

    const handleWindowDragLeave = (e: globalThis.DragEvent) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter === 0) {
        setIsDraggingOverWindow(false);
      }
    };

    const handleWindowDragOver = (e: globalThis.DragEvent) => {
      e.preventDefault();
    };

    const handleWindowDrop = (e: globalThis.DragEvent) => {
      e.preventDefault();
      dragCounter = 0;
      setIsDraggingOverWindow(false);
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
  }, []);

  const handleUploadComplete = (conversionId: string) => {
    refetch(); // Refresh the conversions list
    setSelectedConversionId(conversionId); // Show the newly uploaded conversion
  };

  const handleDeleteConversion = async (id: string) => {
    await deleteConversion(id);
    // If we're viewing the deleted conversion, go back to upload view
    if (selectedConversionId === id) {
      setSelectedConversionId(null);
    }
  };

  const handleNewConversion = () => {
    setSelectedConversionId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Header */}
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main Layout: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          conversions={conversions}
          selectedId={selectedConversionId}
          onSelectConversion={setSelectedConversionId}
          onDeleteConversion={handleDeleteConversion}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            {selectedConversionId ? (
              <ConversionResult
                conversionId={selectedConversionId}
                onDelete={handleDeleteConversion}
                onNewConversion={handleNewConversion}
              />
            ) : (
              <ImageDropzone onUploadComplete={handleUploadComplete} />
            )}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-auto">
        <div className="container mx-auto px-4 py-6 max-w-5xl">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Built with Next.js & Tailwind CSS
          </p>
        </div>
      </footer>

      {/* Full-page Drag Overlay */}
      {isDraggingOverWindow && (
        <div className="drag-overlay animate-fade-in">
          <div className="text-center">
            <svg
              className="w-24 h-24 mx-auto text-white mb-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-3xl font-bold text-white mb-2">
              Drop your image anywhere
            </p>
            <p className="text-white text-opacity-90">
              Release to start processing
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
