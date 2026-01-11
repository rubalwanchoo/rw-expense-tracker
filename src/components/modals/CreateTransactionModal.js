"use client";

import DateInput from "@/components/DateInput";

export default function CreateTransactionModal({
  isOpen,
  formData,
  saving,
  onClose,
  onSubmit,
  onInputChange,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl sm:p-8">
        <h3 className="mb-4 text-xl font-semibold text-gray-800 sm:mb-6 sm:text-2xl">Add Transaction</h3>
        <form onSubmit={onSubmit} className="space-y-4 sm:space-y-5">
          <div>
            <label
              htmlFor="trans_date"
              className="mb-2 block text-sm font-medium text-gray-600"
            >
              Transaction Date
            </label>
            <DateInput
              id="trans_date"
              name="trans_date"
              value={formData.trans_date}
              onChange={onInputChange}
              required
            />
          </div>
          <div>
            <label
              htmlFor="amount"
              className="mb-2 block text-sm font-medium text-gray-600"
            >
              Amount
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={onInputChange}
              required
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-800 placeholder-gray-400 transition-colors focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              placeholder="Enter amount"
            />
          </div>
          <div>
            <label
              htmlFor="type"
              className="mb-2 block text-sm font-medium text-gray-600"
            >
              Type
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={onInputChange}
              required
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-800 transition-colors focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="" disabled>Select type</option>
              <option value="Income">Income</option>
              <option value="Expense">Expense</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-medium text-gray-600"
            >
              Description
            </label>
            <input
              id="description"
              name="description"
              type="text"
              value={formData.description}
              onChange={onInputChange}
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-800 placeholder-gray-400 transition-colors focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              placeholder="Enter description"
            />
          </div>
          <div>
            <label
              htmlFor="source"
              className="mb-2 block text-sm font-medium text-gray-600"
            >
              Source
            </label>
            <input
              id="source"
              name="source"
              type="text"
              value={formData.source}
              onChange={onInputChange}
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-800 placeholder-gray-400 transition-colors focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              placeholder="Enter source (e.g., Credit Card, Cash)"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 font-semibold text-gray-600 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-xl hover:shadow-emerald-500/30 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
