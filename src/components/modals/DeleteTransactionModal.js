"use client";

export default function DeleteTransactionModal({
  isOpen,
  transaction,
  deletePassword,
  deleting,
  onClose,
  onSubmit,
  onPasswordChange,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: 'var(--modal-overlay)' }}>
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border p-5 shadow-2xl transition-colors duration-300 sm:p-8" style={{ backgroundColor: 'var(--modal-bg)', borderColor: 'var(--card-border)' }}>
        <h3 className="mb-3 text-xl font-semibold sm:mb-4 sm:text-2xl" style={{ color: 'var(--foreground)' }}>Delete Transaction</h3>
        <p className="mb-4 text-sm sm:mb-6 sm:text-base" style={{ color: 'var(--muted)' }}>
          Are you sure you want to delete this transaction? This action cannot be undone.
        </p>
        <form onSubmit={onSubmit} className="space-y-4 sm:space-y-5">
          <div>
            <label
              htmlFor="delete_password"
              className="mb-2 block text-sm font-medium"
              style={{ color: 'var(--muted)' }}
            >
              Delete Password <span className="text-red-500">*</span>
            </label>
            <input
              id="delete_password"
              name="delete_password"
              type="password"
              value={deletePassword}
              onChange={onPasswordChange}
              required
              className="w-full rounded-lg border px-4 py-3 transition-colors focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--foreground)' }}
              placeholder="Enter delete password"
            />
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
              disabled={deleting}
              className="flex-1 rounded-lg bg-gradient-to-r from-red-500 to-rose-500 px-4 py-3 font-semibold text-white shadow-lg shadow-red-500/20 transition-all hover:shadow-xl hover:shadow-red-500/30 disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
