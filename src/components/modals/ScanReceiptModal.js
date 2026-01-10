"use client";

import { useRef, useState, useEffect } from "react";

export default function ScanReceiptModal({
  isOpen,
  onClose,
  onScanSubmit,
}) {
  const fileInputRef = useRef(null);
  const [bankSource, setBankSource] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileType, setFileType] = useState(null); // 'image' or 'pdf'
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

  // Create preview URL when file is selected - with error handling for iOS
  useEffect(() => {
    if (selectedFile) {
      // Check if it's a PDF
      const isPdf = selectedFile.type === "application/pdf" || 
                    selectedFile.name?.toLowerCase().endsWith(".pdf");
      
      setFileType(isPdf ? "pdf" : "image");

      if (!isPdf) {
        try {
          const url = URL.createObjectURL(selectedFile);
          setPreviewUrl(url);
          return () => {
            try {
              URL.revokeObjectURL(url);
            } catch (e) {
              console.warn("Error revoking object URL:", e);
            }
          };
        } catch (error) {
          console.warn("Could not create preview URL:", error);
          setPreviewUrl(null);
        }
      } else {
        setPreviewUrl(null); // No preview for PDFs
      }
    } else {
      setPreviewUrl(null);
      setFileType(null);
    }
  }, [selectedFile]);

  const handleCloseModal = () => {
    setBankSource("");
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  const handleFileSelect = (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      // Check if it's an image or PDF
      const isPdf = file.type === "application/pdf" || 
                    file.name?.toLowerCase().endsWith(".pdf");
      
      // On iOS, file.type might be empty for camera captures
      const isImage = !file.type || file.type.startsWith("image/") || 
                      file.name?.match(/\.(jpg|jpeg|png|gif|webp|heic|heif)$/i);
      
      if (!isPdf && !isImage) {
        alert("Please select an image or PDF file");
        return;
      }

      // Validate file size (max 20MB for PDFs, 10MB for images)
      const maxSize = isPdf ? 20 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(`File size must be less than ${isPdf ? "20MB" : "10MB"}`);
        return;
      }

      console.log("File selected:", {
        name: file.name,
        type: file.type,
        size: file.size,
        isPdf
      });

      setSelectedFile(file);
    } catch (error) {
      console.error("Error selecting file:", error);
      alert("Error selecting file. Please try again.");
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      alert("Please select a receipt image or PDF");
      return;
    }

    // Safely handle bankSource string
    const source = String(bankSource || "").replace(/^\s+|\s+$/g, "");
    
    if (!source) {
      alert("Please enter a bank account source");
      return;
    }

    try {
      // Pass values to parent and close modal
      onScanSubmit(selectedFile, source);
      
      // Reset form
      setBankSource("");
      setSelectedFile(null);
      setPreviewUrl(null);
      setFileType(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error submitting:", error);
      alert("Error processing file. Please try again.");
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
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
            <p className="mt-1 text-xs text-slate-500">
              This will be applied to all transactions from this receipt
            </p>
          </div>

          {/* File Input Section */}
          <div>
            <span className="mb-2 block text-sm font-medium text-slate-300">
              Receipt Image or PDF <span className="text-red-400">*</span>
            </span>

            {/* File Preview or Selection */}
            {selectedFile ? (
              <div className="relative">
                <div className="overflow-hidden rounded-lg border border-slate-600 bg-slate-700/50">
                  {fileType === "pdf" ? (
                    // PDF Preview
                    <div className="flex h-32 flex-col items-center justify-center gap-2 p-4">
                      <svg className="h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-6 4h4" />
                      </svg>
                      <span className="text-sm font-medium text-red-400">PDF Document</span>
                    </div>
                  ) : previewUrl ? (
                    // Image Preview
                    <img
                      src={previewUrl}
                      alt="Receipt preview"
                      className="max-h-48 w-full object-contain"
                    />
                  ) : (
                    // Fallback
                    <div className="flex h-32 items-center justify-center">
                      <span className="text-sm text-slate-400">File selected (preview unavailable)</span>
                    </div>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-emerald-400">
                    {selectedFile.name || "File"} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                  <button
                    type="button"
                    onClick={handleClearFile}
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
              /* Use label instead of button for iOS compatibility */
              <label
                htmlFor="receiptFileInput"
                className="relative flex w-full cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed border-emerald-500/50 bg-emerald-500/10 p-6 text-emerald-400 transition-all hover:border-emerald-400 hover:bg-emerald-500/20"
              >
                <div className="flex gap-4">
                  {/* Camera/Image Icon */}
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
                  {/* PDF Icon */}
                  <svg className="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-6 4h4" />
                  </svg>
                </div>
                <div className="text-center">
                  <span className="text-sm font-medium">
                    {isMobile ? "Tap to Take Photo, Choose Image, or Select PDF" : "Click to upload image or PDF"}
                  </span>
                  <p className="mt-1 text-xs text-slate-400">PNG, JPG, GIF, PDF up to 20MB</p>
                </div>
                {/* File input inside label */}
                <input
                  ref={fileInputRef}
                  id="receiptFileInput"
                  type="file"
                  accept="image/*,.pdf,application/pdf"
                  onChange={handleFileSelect}
                  style={{
                    position: 'absolute',
                    width: '1px',
                    height: '1px',
                    padding: 0,
                    margin: '-1px',
                    overflow: 'hidden',
                    clip: 'rect(0, 0, 0, 0)',
                    whiteSpace: 'nowrap',
                    border: 0,
                  }}
                />
              </label>
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
