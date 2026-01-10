"use client";

import { useRef, useState } from "react";

export default function ScanReceiptModal({
  isOpen,
  onClose,
  onScanSubmit,
}) {
  const fileInputRef = useRef(null);
  const [bankSource, setBankSource] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const handleCloseModal = () => {
    setBankSource("");
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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

          {/* File Input */}
          <div>
            <label
              htmlFor="receiptImage"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Receipt Image <span className="text-red-400">*</span>
            </label>
            <input
              ref={fileInputRef}
              id="receiptImage"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white file:mr-4 file:rounded-md file:border-0 file:bg-emerald-500/20 file:px-3 file:py-1 file:text-sm file:font-medium file:text-emerald-400 hover:file:bg-emerald-500/30"
              required
            />
            {selectedFile && (
              <p className="mt-1 text-xs text-emerald-400">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
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
