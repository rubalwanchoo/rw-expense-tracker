"use client";

import FilterBox from "./FilterBox";

export default function ProjectsTable({
  projects,
  loading,
  filterText,
  onFilterChange,
  onEdit,
  onDelete,
}) {
  return (
    <div className="mt-12 w-full">
      <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-left text-xl font-semibold text-white">Your Projects</h3>
        <div className="w-full sm:w-auto">
          {onFilterChange && (
            <FilterBox
              value={filterText}
              onChange={onFilterChange}
              placeholder="Filter projects..."
            />
          )}
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/50">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50 bg-slate-800/80">
              <th className="px-6 py-4 text-left text-sm font-semibold text-emerald-400">
                Name
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-emerald-400">
                Description
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-emerald-400">
                Created
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-emerald-400">
                Last Updated
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-emerald-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent"></div>
                    <p className="text-slate-400">Loading projects...</p>
                  </div>
                </td>
              </tr>
            ) : projects.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      className="h-12 w-12 text-slate-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                      />
                    </svg>
                    <p className="text-slate-400">No projects created yet</p>
                    <p className="text-sm text-slate-500">
                      Click the button above to create your first tracker project
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <tr
                  key={project.id}
                  className="border-b border-slate-700/30 transition-colors hover:bg-slate-700/20"
                >
                  <td className="px-6 py-4 text-left text-white">
                    {project.name}
                  </td>
                  <td className="px-6 py-4 text-left text-slate-300">
                    {project.description || "-"}
                  </td>
                  <td className="px-6 py-4 text-left text-slate-300">
                    {project.dtm_created
                      ? new Date(project.dtm_created).toLocaleString()
                      : "-"}
                  </td>
                  <td className="px-6 py-4 text-left text-slate-300">
                    {project.dtm_modified
                      ? new Date(project.dtm_modified).toLocaleString()
                      : "-"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="group rounded-lg p-2 text-blue-500 transition-all duration-200 hover:bg-blue-500/20 hover:text-blue-300"
                        title="Edit"
                        onClick={() => onEdit(project)}
                      >
                        <svg
                          className="h-5 w-5 transition-transform duration-200 group-hover:scale-125 group-hover:rotate-12"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        className="group rounded-lg p-2 text-red-500 transition-all duration-200 hover:bg-red-500/20 hover:text-red-300"
                        title="Delete"
                        onClick={() => onDelete(project)}
                      >
                        <svg
                          className="h-5 w-5 transition-transform duration-200 group-hover:scale-125 group-hover:animate-pulse"
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
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

