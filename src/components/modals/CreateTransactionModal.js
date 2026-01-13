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
  // Check if type is Payment - category should be auto-set
  const isPaymentType = formData.type === "Payment";

  // Custom handler for type change - auto-set category when Payment is selected
  const handleTypeChange = (e) => {
    const newType = e.target.value;
    onInputChange(e); // Update type first
    
    // If Payment is selected, auto-set category to Payment
    if (newType === "Payment") {
      onInputChange({
        target: { name: "category", value: "Payment" }
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: 'var(--modal-overlay)' }}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border p-5 shadow-2xl sm:p-8 transition-colors duration-300" style={{ backgroundColor: 'var(--modal-bg)', borderColor: 'var(--card-border)' }}>
        <h3 className="mb-4 text-xl font-semibold sm:mb-6 sm:text-2xl" style={{ color: 'var(--foreground)' }}>Add Transaction</h3>
        <form onSubmit={onSubmit} className="space-y-4 sm:space-y-5">
          <div>
            <label
              htmlFor="trans_date"
              className="mb-2 block text-sm font-medium"
              style={{ color: 'var(--muted)' }}
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
              className="mb-2 block text-sm font-medium"
              style={{ color: 'var(--muted)' }}
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
              className="w-full rounded-lg border px-4 py-3 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--foreground)' }}
              placeholder="Enter amount"
            />
          </div>
          <div>
            <label
              htmlFor="type"
              className="mb-2 block text-sm font-medium"
              style={{ color: 'var(--muted)' }}
            >
              Type
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleTypeChange}
              required
              className="w-full rounded-lg border px-4 py-3 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--foreground)' }}
            >
              <option value="" disabled>Select type</option>
              <option value="Payment">Payment</option>
              <option value="Expense">Expense</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-medium"
              style={{ color: 'var(--muted)' }}
            >
              Description
            </label>
            <input
              id="description"
              name="description"
              type="text"
              value={formData.description}
              onChange={onInputChange}
              className="w-full rounded-lg border px-4 py-3 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--foreground)' }}
              placeholder="Enter description"
            />
          </div>
          <div>
            <label
              htmlFor="source"
              className="mb-2 block text-sm font-medium"
              style={{ color: 'var(--muted)' }}
            >
              Source
            </label>
            <input
              id="source"
              name="source"
              type="text"
              value={formData.source}
              onChange={onInputChange}
              className="w-full rounded-lg border px-4 py-3 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--foreground)' }}
              placeholder="Enter source (e.g., Credit Card, Cash)"
            />
          </div>
          <div>
            <label
              htmlFor="category"
              className="mb-2 block text-sm font-medium"
              style={{ color: 'var(--muted)' }}
            >
              Category
              {isPaymentType && (
                <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">(Auto-set for Payment)</span>
              )}
            </label>
            <select
              id="category"
              name="category"
              value={isPaymentType ? "Payment" : formData.category}
              onChange={onInputChange}
              required
              disabled={isPaymentType}
              className={`w-full rounded-lg border px-4 py-3 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                isPaymentType 
                  ? "cursor-not-allowed opacity-70" 
                  : ""
              }`}
              style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--foreground)' }}
            >
              <option value="" disabled>Select category</option>
              <option value="Payment">Payment</option>
              <option value="Groceries">Groceries</option>
              <option value="Dining">Dining</option>
              <option value="Gas">Gas</option>
              <option value="Shopping">Shopping</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Travel">Travel</option>
              <option value="Utilities">Utilities</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border px-4 py-3 font-semibold transition-colors hover:bg-gray-50 dark:hover:bg-slate-700"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'var(--muted)' }}
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
