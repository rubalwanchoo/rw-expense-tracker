"use client";

import { useRef, useState } from "react";

export default function ScanReceiptButton({ onExpenseParsed, disabled }) {
  const fileInputRef = useRef(null);
  const [scanning, setScanning] = useState(false);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
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

    try {
      setScanning(true);
      
      console.log("\n%c========== RECEIPT SCAN (Browser) ==========", "color: #10b981; font-weight: bold;");
      console.log("📷 Uploading image:", file.name, `(${(file.size / 1024).toFixed(2)} KB)`);

      const formData = new FormData();
      formData.append("image", file);

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
        const transactions = Array.isArray(result.data) ? result.data : [result.data];
        console.log(`\n%c✅ PARSED ${transactions.length} TRANSACTION(S):`, "color: #10b981; font-weight: bold;");
        transactions.forEach((t, i) => {
          console.log(`%cTransaction ${i + 1}:`, "color: #3b82f6;");
          console.table(t);
        });
        console.log("%c========== SCAN COMPLETE ==========\n", "color: #10b981; font-weight: bold;");
        onExpenseParsed(result.data);
      }
    } catch (error) {
      console.error("%c❌ Error scanning receipt:", "color: #ef4444; font-weight: bold;", error);
      alert(error.message || "Failed to scan receipt. Please try again.");
    } finally {
      setScanning(false);
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || scanning}
        className="flex items-center gap-2 rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-400 transition-all hover:bg-emerald-500/20 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {scanning ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent"></div>
            <span>Scanning...</span>
          </>
        ) : (
          <>
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
          </>
        )}
      </button>
    </>
  );
}
