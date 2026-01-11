"use client";

export default function EditProjectModal({
  isOpen,
  project,
  formData,
  updating,
  onClose,
  onSubmit,
  onInputChange,
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
          <h2 className="text-lg font-semibold text-gray-800 sm:text-xl">Edit Project</h2>
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

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="edit_name"
              className="mb-2 block text-sm font-medium text-gray-600"
            >
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="edit_name"
              name="name"
              value={formData.name}
              onChange={onInputChange}
              required
              placeholder="Enter project name"
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-800 placeholder-gray-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label
              htmlFor="edit_description"
              className="mb-2 block text-sm font-medium text-gray-600"
            >
              Description
            </label>
            <textarea
              id="edit_description"
              name="description"
              value={formData.description}
              onChange={onInputChange}
              rows={3}
              placeholder="Enter project description"
              className="w-full resize-none rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-800 placeholder-gray-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label
              htmlFor="edit_modified_by"
              className="mb-2 block text-sm font-medium text-gray-600"
            >
              Modified By <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="edit_modified_by"
              name="modified_by"
              value={formData.modified_by}
              onChange={onInputChange}
              required
              placeholder="Enter your name"
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-800 placeholder-gray-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating}
              className="flex-1 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 font-medium text-white shadow-lg shadow-blue-500/20 transition-all hover:shadow-xl hover:shadow-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updating ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
