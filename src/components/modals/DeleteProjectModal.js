"use client";

export default function DeleteProjectModal({
  isOpen,
  project,
  deletePassword,
  deleting,
  onClose,
  onSubmit,
  onPasswordChange,
  hasTransactions = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ backgroundColor: 'var(--modal-overlay)' }}
        onClick={onClose}
      ></div>
      <div className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border p-5 shadow-2xl transition-colors duration-300 sm:p-6" style={{ backgroundColor: 'var(--modal-bg)', borderColor: 'var(--card-border)' }}>
        <div className="mb-4 flex items-center justify-between sm:mb-6">
          <h2 className="text-lg font-semibold sm:text-xl" style={{ color: 'var(--foreground)' }}>Delete Project</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 transition-colors hover:bg-gray-100 dark:hover:bg-slate-700"
            style={{ color: 'var(--muted-light)' }}
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
              <div className="rounded-full bg-red-50 dark:bg-red-900/30 p-4">
                <svg
                  className="h-8 w-8 text-red-500 dark:text-red-400"
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
            <p className="text-center" style={{ color: 'var(--muted)' }}>
              Are you sure you want to delete the project{" "}
              <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
                "{project?.name}"
              </span>
              ?
            </p>
            <p className="mt-2 text-center text-sm" style={{ color: 'var(--muted-light)' }}>
              This action cannot be undone.
            </p>
            {hasTransactions && (
              <div 
                className="mt-4 rounded-lg border-2 p-3 dark:bg-amber-900/30"
                style={{ backgroundColor: 'transparent', borderColor: '#f59e0b' }}
              >
                <div className="flex items-start gap-2">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0" style={{ color: '#f59e0b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#d97706' }}>Warning</p>
                    <p className="text-xs" style={{ color: '#f59e0b' }}>
                      This project has transactions. Please delete all transactions first before deleting the project.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mb-6">
            <label
              htmlFor="delete_password"
              className="mb-2 block text-sm font-medium"
              style={{ color: 'var(--muted)' }}
            >
              Delete Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="delete_password"
              name="delete_password"
              value={deletePassword}
              onChange={onPasswordChange}
              required
              placeholder="Enter delete password"
              className="w-full rounded-lg border px-4 py-3 transition-colors focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--foreground)' }}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border px-4 py-3 font-medium transition-colors hover:bg-gray-50 dark:hover:bg-slate-700"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'var(--muted)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={deleting}
              className="flex-1 rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-4 py-3 font-medium text-white shadow-lg shadow-red-500/20 transition-all hover:shadow-xl hover:shadow-red-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
