"use client";

export default function EditTransactionModal({
  isOpen,
  transaction,
  formData,
  updating,
  onClose,
  onSubmit,
  onInputChange,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700/60 bg-slate-800/95 p-8 shadow-2xl">
        <h3 className="mb-6 text-2xl font-semibold text-white">Edit Transaction</h3>
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="edit_trans_date"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Transaction Date
            </label>
            <input
              id="edit_trans_date"
              name="trans_date"
              type="date"
              value={formData.trans_date}
              onChange={onInputChange}
              required
              className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label
              htmlFor="edit_amount"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Amount
            </label>
            <input
              id="edit_amount"
              name="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={onInputChange}
              required
              className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Enter amount"
            />
          </div>
          <div>
            <label
              htmlFor="edit_type"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Type
            </label>
            <select
              id="edit_type"
              name="type"
              value={formData.type}
              onChange={onInputChange}
              required
              className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="" disabled>Select type</option>
              <option value="Income">Income</option>
              <option value="Expense">Expense</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="edit_description"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Description
            </label>
            <input
              id="edit_description"
              name="description"
              type="text"
              value={formData.description}
              onChange={onInputChange}
              className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Enter description"
            />
          </div>
          <div>
            <label
              htmlFor="edit_merchant"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Merchant
            </label>
            <input
              id="edit_merchant"
              name="merchant"
              type="text"
              value={formData.merchant}
              onChange={onInputChange}
              className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Enter merchant name"
            />
          </div>
          <div>
            <label
              htmlFor="edit_source"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Source
            </label>
            <input
              id="edit_source"
              name="source"
              type="text"
              value={formData.source}
              onChange={onInputChange}
              className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Enter source (e.g., Credit Card, Cash)"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 font-semibold text-slate-300 transition-colors hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating}
              className="flex-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 font-semibold text-white transition-all hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50"
            >
              {updating ? "Updating..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
