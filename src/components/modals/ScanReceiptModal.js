"use client";

import { useRef, useState, useEffect } from "react";

export default function ScanReceiptModal({
  isOpen,
  onClose,
  onScanSubmit,
}) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [bankSource, setBankSource] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth <= 768;
      
      setIsMobile(mobileRegex.test(userAgent.toLowerCase()) || (isTouchDevice && isSmallScreen));
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Create preview URL when file is selected
  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  const handleCloseModal = () => {
    setBankSource("");
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
    onClose();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("Image size must be less than 10MB");
      return;
    }

    setSelectedFile(file);
  };

  const handleTakePhoto = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const handleChooseFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleClearImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      alert("Please select a receipt image");
      return;
    }

    if (!bankSource.trim()) {
      alert("Please enter a bank account source");
      return;
    }

    // Pass values to parent and close modal
    onScanSubmit(selectedFile, bankSource.trim());
    
    // Reset form
    setBankSource("");
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleCloseModal}
      ></div>
      <div className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-700/60 bg-slate-800/95 p-5 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white sm:text-xl">
            Scan Receipt
          </h3>
          <button
            type="button"
            onClick={handleCloseModal}
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Bank Account Source Input */}
          <div>
            <label
              htmlFor="bankSource"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Bank Account Source <span className="text-red-400">*</span>
            </label>
            <input
              id="bankSource"
              type="text"
              value={bankSource}
              onChange={(e) => setBankSource(e.target.value)}
              placeholder="e.g., Chase Checking, Amex Credit Card"
              className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
            <p className="mt-1 text-xs text-slate-500">
              This will be applied to all transactions from this receipt
            </p>
          </div>

          {/* Image Input Section */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Receipt Image <span className="text-red-400">*</span>
            </label>

            {/* Hidden file inputs */}
            {/* Camera input for mobile - opens camera directly */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture
              onChange={handleFileSelect}
              className="hidden"
            />
            {/* Regular file input for gallery/desktop */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Image Preview or Selection Buttons */}
            {selectedFile && previewUrl ? (
              <div className="relative">
                <div className="overflow-hidden rounded-lg border border-slate-600 bg-slate-700/50">
                  <img
                    src={previewUrl}
                    alt="Receipt preview"
                    className="max-h-48 w-full object-contain"
                  />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-emerald-400">
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-red-400 transition-colors hover:bg-red-500/20"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {isMobile ? (
                  /* Mobile: Show Camera and Gallery buttons */
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleTakePhoto}
                      className="flex flex-1 flex-col items-center gap-2 rounded-lg border-2 border-dashed border-emerald-500/50 bg-emerald-500/10 p-4 text-emerald-400 transition-all hover:border-emerald-400 hover:bg-emerald-500/20"
                    >
                      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span className="text-sm font-medium">Take Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleChooseFile}
                      className="flex flex-1 flex-col items-center gap-2 rounded-lg border-2 border-dashed border-slate-500/50 bg-slate-700/30 p-4 text-slate-400 transition-all hover:border-slate-400 hover:bg-slate-700/50"
                    >
                      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-sm font-medium">Gallery</span>
                    </button>
                  </div>
                ) : (
                  /* Desktop: Show file picker button */
                  <button
                    type="button"
                    onClick={handleChooseFile}
                    className="flex w-full flex-col items-center gap-3 rounded-lg border-2 border-dashed border-slate-500/50 bg-slate-700/30 p-6 text-slate-400 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-400"
                  >
                    <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <div className="text-center">
                      <span className="text-sm font-medium">Click to upload receipt image</span>
                      <p className="mt-1 text-xs text-slate-500">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleCloseModal}
              className="flex-1 rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 font-semibold text-slate-300 transition-colors hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedFile || !bankSource.trim()}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 font-semibold text-white transition-all hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50"
            >
              <span>Scan & Import</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
