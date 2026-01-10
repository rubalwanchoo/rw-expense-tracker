"use client";

import DateInput from "@/components/DateInput";

export default function DateRangeModal({
  isOpen,
  pendingDateStart,
  pendingDateEnd,
  onPendingDateStartChange,
  onPendingDateEndChange,
  onApply,
  onClear,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-700/60 bg-slate-800/95 p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-lg font-semibold text-white">Select Date Range</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">From</label>
            <DateInput
              id="pendingDateStart"
              name="pendingDateStart"
              value={pendingDateStart}
              onChange={(e) => onPendingDateStartChange(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">To</label>
            <DateInput
              id="pendingDateEnd"
              name="pendingDateEnd"
              value={pendingDateEnd}
              onChange={(e) => onPendingDateEndChange(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-sm font-medium text-slate-400 transition-all hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onApply}
              className="flex-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-emerald-500/25"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
