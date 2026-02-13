"use client";

import { useState, useEffect } from "react";
import { useConversions } from "@/lib/hooks/use-conversions";
import { useUpload } from "@/lib/hooks/use-upload";
import { useWindowDragDrop } from "@/lib/hooks/use-window-drag-drop";
import { useDeleteConfirmation } from "@/lib/hooks/use-delete-confirmation";
import Header from "./header";
import Sidebar from "./sidebar";
import ImageDropzone from "./image-dropzone";
import ConversionResult from "./conversion-result";
import ConfirmationModal from "./confirmation-modal";
import Modal from "./modal";

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
  // isDraggingOverWindow is now handled by the hook
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

  const { isDraggingOverWindow } = useWindowDragDrop({
    onFileDrop: handleFileSelect,
    onInvalidType: () => setShowInvalidFileModal(true),
  });

  const handleUploadComplete = (conversionId: string) => {
    refetch(); // Refresh the conversions list
    setSelectedConversionId(conversionId); // Show the newly uploaded conversion
  };

  const {
    deleteConfirmation,
    isDeleting,
    requestDelete,
    cancelDelete,
    confirmDelete,
  } = useDeleteConfirmation({
    onDelete: deleteConversion,
    onSuccess: () => {
      // If we're viewing the deleted conversion, go back to upload view
      if (selectedConversionId === deleteConfirmation.id) {
        setSelectedConversionId(null);
      }
    },
  });

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
          onDeleteClick={requestDelete}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto h-full p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            {selectedConversionId ? (
              <ConversionResult
                conversionId={selectedConversionId}
                onDeleteClick={() => requestDelete(selectedConversionId)}
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
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete Conversion"
        message="Are you sure you want to delete this conversion? This action cannot be undone."
        confirmText="Delete"
        isDestructive={true}
        isLoading={isDeleting}
      />

      {/* Invalid File Modal */}
      <Modal
        isOpen={showInvalidFileModal}
        onClose={() => setShowInvalidFileModal(false)}
      >
        <div className="p-6">
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
      </Modal>

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
