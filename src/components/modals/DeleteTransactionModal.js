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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-700/60 bg-slate-800/95 p-8 shadow-2xl">
        <h3 className="mb-4 text-2xl font-semibold text-white">Delete Transaction</h3>
        <p className="mb-6 text-slate-400">
          Are you sure you want to delete this transaction? This action cannot be undone.
        </p>
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="delete_password"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Delete Password <span className="text-red-400">*</span>
            </label>
            <input
              id="delete_password"
              name="delete_password"
              type="password"
              value={deletePassword}
              onChange={onPasswordChange}
              required
              className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 transition-colors focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              placeholder="Enter delete password"
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
              disabled={deleting}
              className="flex-1 rounded-lg bg-gradient-to-r from-red-500 to-rose-500 px-4 py-3 font-semibold text-white transition-all hover:shadow-lg hover:shadow-red-500/25 disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
