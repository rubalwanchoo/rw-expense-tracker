"use client";

export default function DeleteProjectModal({
  isOpen,
  project,
  deletePassword,
  deleting,
  onClose,
  onSubmit,
  onPasswordChange,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-700/50 bg-slate-800 p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Delete Project</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
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
              <div className="rounded-full bg-red-500/20 p-4">
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
            <p className="text-center text-slate-300">
              Are you sure you want to delete the project{" "}
              <span className="font-semibold text-white">
                "{project?.name}"
              </span>
              ?
            </p>
            <p className="mt-2 text-center text-sm text-slate-400">
              This action cannot be undone.
            </p>
          </div>

          <div className="mb-6">
            <label
              htmlFor="delete_password"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Delete Password <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              id="delete_password"
              name="delete_password"
              value={deletePassword}
              onChange={onPasswordChange}
              required
              placeholder="Enter delete password"
              className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 transition-colors focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-600 px-4 py-3 font-medium text-slate-300 transition-colors hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={deleting}
              className="flex-1 rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-4 py-3 font-medium text-white transition-all hover:shadow-lg hover:shadow-red-500/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

