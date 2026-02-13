"use client";

import { useState, useEffect, DragEvent } from "react";
import { useConversions } from "@/lib/hooks/use-conversions";
import { useUpload } from "@/lib/hooks/use-upload";
import Header from "./header";
import Sidebar from "./sidebar";
import ImageDropzone from "./image-dropzone";
import ConversionResult from "./conversion-result";
import ConfirmationModal from "./confirmation-modal";
import { createPortal } from "react-dom";

/**
 * Main app shell managing overall layout and state
 * - Header with login controls
 * - Sidebar with conversion history (drawer on mobile)
 * - Main content area (dropzone or result view)
 * - Full-page drag overlay for drop-anywhere functionality
 */
export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedConversionId, setSelectedConversionId] = useState<
    string | null
  >(null);
  const [isDraggingOverWindow, setIsDraggingOverWindow] = useState(false);
  const [showInvalidFileModal, setShowInvalidFileModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { conversions, isLoading, deleteConversion, refetch } =
    useConversions();

  const {
    upload,
    isUploading,
    error: uploadError,
    reset: resetUpload,
  } = useUpload();

  useEffect(() => {
    setMounted(true);
  }, []);

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

      const file = e.dataTransfer?.files?.[0];
      if (file) {
        // Simple client-side check for image type before even trying to upload
        if (!file.type.startsWith("image/")) {
          setShowInvalidFileModal(true);
          return;
        }

        handleFileSelect(file);
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
  }, []);

  const handleFileSelect = async (file: File) => {
    // If not already on upload screen, go there
    if (selectedConversionId) {
      setSelectedConversionId(null);
    }

    try {
      const result = await upload(file);
      handleUploadComplete(result.id);
    } catch (err) {
      console.error("Upload failed:", err);
      // Check if error is related to invalid file type to show modal
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (
        errorMessage.includes("Invalid file type") ||
        errorMessage.includes("Invalid file") ||
        errorMessage.includes("is not supported")
      ) {
        setShowInvalidFileModal(true);
      }
      // userUpload hook handles the error state for the UI
    }
  };

  const handleUploadComplete = (conversionId: string) => {
    refetch(); // Refresh the conversions list
    setSelectedConversionId(conversionId); // Show the newly uploaded conversion
  };

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    id: string;
    isOpen: boolean;
  }>({ id: "", isOpen: false });
  const [isDeleting, setIsDeleting] = useState(false);

  // This initiates the delete flow (opens modal)
  const handleDeleteClick = (id: string) => {
    setDeleteConfirmation({ id, isOpen: true });
  };

  // This handles the actual deletion after confirmation
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmation.id) return;

    setIsDeleting(true);
    try {
      await deleteConversion(deleteConfirmation.id);

      // If we're viewing the deleted conversion, go back to upload view
      if (selectedConversionId === deleteConfirmation.id) {
        setSelectedConversionId(null);
      }

      setDeleteConfirmation({ id: "", isOpen: false });
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete conversion");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNewConversion = () => {
    setSelectedConversionId(null);
    resetUpload();
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-950 flex flex-col overflow-hidden">
      {/* Header */}
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main Layout: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden h-full">
        {/* Sidebar */}
        <Sidebar
          conversions={conversions}
          selectedId={selectedConversionId}
          onSelectConversion={setSelectedConversionId}
          onDeleteClick={handleDeleteClick}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto h-full p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            {selectedConversionId ? (
              <ConversionResult
                conversionId={selectedConversionId}
                onDeleteClick={() => handleDeleteClick(selectedConversionId)}
                onNewConversion={handleNewConversion}
              />
            ) : (
              <ImageDropzone
                isUploading={isUploading}
                error={uploadError}
                onFileSelect={handleFileSelect}
                onRetry={resetUpload}
              />
            )}
          </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() =>
          setDeleteConfirmation({ ...deleteConfirmation, isOpen: false })
        }
        onConfirm={handleDeleteConfirm}
        title="Delete Conversion"
        message="Are you sure you want to delete this conversion? This action cannot be undone."
        confirmText="Delete"
        isDestructive={true}
        isLoading={isDeleting}
      />

      {/* Invalid File Modal */}
      {showInvalidFileModal &&
        mounted &&
        // ... existing invalid modal code
        createPortal(
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-sm w-full shadow-xl animate-scale-up">
              <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">
                Invalid File Type
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Please upload a valid image file (PNG, JPEG, WebP).
              </p>
              <button
                onClick={() => setShowInvalidFileModal(false)}
                className="w-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition"
              >
                Dismiss
              </button>
            </div>
          </div>,
          document.body,
        )}

      {/* Full-page Drag Overlay */}
      {isDraggingOverWindow && (
        // ... existing overlay code
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
