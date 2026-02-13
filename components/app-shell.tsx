"use client";

import { useState } from "react";
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
import { IconUpload } from "./icons";
import { ALLOWED_IMAGE_LABEL } from "@/lib/constants/image-formats";

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
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [showInvalidFileModal, setShowInvalidFileModal] = useState(false);

  const { conversions, isLoading, deleteConversion, refetch } =
    useConversions();

  const {
    upload,
    isUploading,
    error: uploadError,
    reset: resetUpload,
  } = useUpload();

  const handleFileSelect = async (file: File) => {
    // If not already on upload screen, go there
    if (selectedConversionId) {
      setSelectedConversionId(null);
    }

    setUploadingFile(file);

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
    } finally {
      setUploadingFile(null);
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
                onRenameSuccess={refetch}
              />
            ) : (
              <ImageDropzone
                isUploading={isUploading}
                uploadingFile={uploadingFile}
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
            Please upload a valid image file ({ALLOWED_IMAGE_LABEL}).
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
        <div className="drag-overlay animate-fade-in">
          <div className="text-center">
            <IconUpload
              size="xl"
              className="mx-auto text-white mb-6"
            />
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
