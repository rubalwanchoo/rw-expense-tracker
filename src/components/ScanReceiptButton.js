"use client";

import { useRef, useState } from "react";

export default function ScanReceiptButton({ onExpenseParsed, onScanStart, onScanError, disabled }) {
  const fileInputRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bankSource, setBankSource] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const handleButtonClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setBankSource("");
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      alert("Please select a receipt image");
      return;
    }

    if (!bankSource.trim()) {
      alert("Please enter a bank account source");
      return;
    }

    // Capture values before closing modal
    const fileToUpload = selectedFile;
    const sourceToApply = bankSource.trim();
    
    // Close modal immediately and notify parent that scanning has started
    handleCloseModal();
    if (onScanStart) onScanStart();
    
    try {
      console.log("\n%c========== RECEIPT SCAN (Browser) ==========", "color: #10b981; font-weight: bold;");
      console.log("📷 Uploading image:", fileToUpload.name, `(${(fileToUpload.size / 1024).toFixed(2)} KB)`);
      console.log("🏦 Bank Source:", sourceToApply);

      const formData = new FormData();
      formData.append("image", fileToUpload);

      const response = await fetch("/api/parse-expense", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      
      console.log("\n%c📄 API Response:", "color: #3b82f6; font-weight: bold;");
      console.log(result);

      if (!response.ok) {
        throw new Error(result.error || "Failed to parse receipt");
      }

      if (result.success && result.data) {
        let transactions = Array.isArray(result.data) ? result.data : [result.data];
        
        // Apply the user-provided bank source to all transactions
        transactions = transactions.map(t => ({
          ...t,
          source: sourceToApply,
        }));
        
        console.log(`\n%c✅ PARSED ${transactions.length} TRANSACTION(S) with source "${sourceToApply}":`, "color: #10b981; font-weight: bold;");
        transactions.forEach((t, i) => {
          console.log(`%cTransaction ${i + 1}:`, "color: #3b82f6;");
          console.table(t);
        });
        console.log("%c========== SCAN COMPLETE ==========\n", "color: #10b981; font-weight: bold;");
        
        onExpenseParsed(transactions);
      }
    } catch (error) {
      console.error("%c❌ Error scanning receipt:", "color: #ef4444; font-weight: bold;", error);
      alert(error.message || "Failed to scan receipt. Please try again.");
      if (onScanError) onScanError();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={disabled}
        className="flex items-center gap-2 rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-400 transition-all hover:bg-emerald-500/20 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
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
        <span>Scan Receipt</span>
      </button>

      {/* Scan Receipt Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-20 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700/60 bg-slate-800/95 p-5 shadow-2xl sm:p-6">
            <h3 className="mb-4 text-lg font-semibold text-white sm:text-xl">
              Scan Receipt
            </h3>
            <form onSubmit={handleScanSubmit} className="space-y-4">
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
      )}
    </>
  );
}
