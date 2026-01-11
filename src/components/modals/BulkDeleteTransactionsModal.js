"use client";

export default function BulkDeleteTransactionsModal({
  isOpen,
  selectedCount,
  password,
  onPasswordChange,
  onSubmit,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-center justify-between sm:mb-6">
          <h2 className="text-lg font-semibold text-gray-800 sm:text-xl">Delete Transactions</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
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

        <form onSubmit={onSubmit}>
          <div className="mb-6">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-red-50 p-4">
                <svg
                  className="h-8 w-8 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
            </div>
            <p className="text-center text-gray-600">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-800">
                {selectedCount} transaction{selectedCount !== 1 ? "s" : ""}
              </span>
              ?
            </p>
            <p className="mt-2 text-center text-sm text-gray-400">
              This action cannot be undone.
            </p>
          </div>

          <div className="mb-6">
            <label
              htmlFor="bulk_delete_password"
              className="mb-2 block text-sm font-medium text-gray-600"
            >
              Delete Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="bulk_delete_password"
              name="bulk_delete_password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              required
              placeholder="Enter delete password"
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-800 placeholder-gray-400 transition-colors focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-4 py-3 font-medium text-white shadow-lg shadow-red-500/20 transition-all hover:shadow-xl hover:shadow-red-500/30"
            >
              Delete {selectedCount} Item{selectedCount !== 1 ? "s" : ""}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
