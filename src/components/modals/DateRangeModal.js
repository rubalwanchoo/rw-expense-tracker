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
        className="absolute inset-0 backdrop-blur-sm"
        style={{ backgroundColor: 'var(--modal-overlay)' }}
        onClick={onClose}
      ></div>
      <div className="relative z-10 w-full max-w-sm rounded-2xl border p-5 shadow-2xl transition-colors duration-300" style={{ backgroundColor: 'var(--modal-bg)', borderColor: 'var(--card-border)' }}>
        <div className="mb-4 flex items-center justify-between">
          <span className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Select Date Range</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 transition-colors hover:bg-gray-100 dark:hover:bg-slate-700"
            style={{ color: 'var(--muted-light)' }}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--muted)' }}>From</label>
            <DateInput
              id="pendingDateStart"
              name="pendingDateStart"
              value={pendingDateStart}
              onChange={(e) => onPendingDateStartChange(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--muted)' }}>To</label>
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
              className="flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-all hover:bg-gray-50 dark:hover:bg-slate-700"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'var(--muted)' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onApply}
              className="flex-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-xl hover:shadow-emerald-500/30"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
