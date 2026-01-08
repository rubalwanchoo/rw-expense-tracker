"use client";

import { useRouter } from "next/navigation";
import FilterBox from "./FilterBox";
import SortIcon from "./SortIcon";

export default function ProjectsTable({
  projects,
  loading,
  filterText,
  onFilterChange,
  onEdit,
  onDelete,
  sortColumn,
  sortDirection,
  onSort,
}) {
  const router = useRouter();

  const handleRowClick = (project) => {
    router.push(`/dashboard/transactions/${project.id}`);
  };
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
      <div className="overflow-x-auto rounded-xl border border-slate-700/50 bg-slate-800/50">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-slate-700/50 bg-slate-800/80">
              <th
                className="cursor-pointer whitespace-nowrap px-3 py-3 text-left text-xs font-semibold text-emerald-400 transition-colors hover:text-emerald-300 sm:px-6 sm:py-4 sm:text-sm"
                onClick={() => onSort && onSort("name")}
              >
                <div className="flex items-center">
                  Name
                  {onSort && <SortIcon column="name" sortColumn={sortColumn} sortDirection={sortDirection} />}
                </div>
              </th>
              <th
                className="cursor-pointer whitespace-nowrap px-3 py-3 text-left text-xs font-semibold text-emerald-400 transition-colors hover:text-emerald-300 sm:px-6 sm:py-4 sm:text-sm"
                onClick={() => onSort && onSort("description")}
              >
                <div className="flex items-center">
                  Description
                  {onSort && <SortIcon column="description" sortColumn={sortColumn} sortDirection={sortDirection} />}
                </div>
              </th>
              <th
                className="cursor-pointer whitespace-nowrap px-3 py-3 text-left text-xs font-semibold text-emerald-400 transition-colors hover:text-emerald-300 sm:px-6 sm:py-4 sm:text-sm"
                onClick={() => onSort && onSort("dtm_created")}
              >
                <div className="flex items-center">
                  Created
                  {onSort && <SortIcon column="dtm_created" sortColumn={sortColumn} sortDirection={sortDirection} />}
                </div>
              </th>
              <th
                className="cursor-pointer whitespace-nowrap px-3 py-3 text-left text-xs font-semibold text-emerald-400 transition-colors hover:text-emerald-300 sm:px-6 sm:py-4 sm:text-sm"
                onClick={() => onSort && onSort("dtm_modified")}
              >
                <div className="flex items-center">
                  Updated
                  {onSort && <SortIcon column="dtm_modified" sortColumn={sortColumn} sortDirection={sortDirection} />}
                </div>
              </th>
              <th className="whitespace-nowrap px-3 py-3 text-center text-xs font-semibold text-emerald-400 sm:px-6 sm:py-4 sm:text-sm">
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
                  onClick={() => handleRowClick(project)}
                  className="cursor-pointer border-b border-slate-700/30 transition-all duration-200 hover:bg-slate-700/30 hover:shadow-lg"
                >
                  <td className="whitespace-nowrap px-3 py-3 text-left text-sm text-white sm:px-6 sm:py-4">
                    {project.name}
                  </td>
                  <td className="max-w-[150px] truncate px-3 py-3 text-left text-sm text-slate-300 sm:max-w-none sm:px-6 sm:py-4">
                    {project.description || "-"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-left text-xs text-slate-300 sm:px-6 sm:py-4 sm:text-sm">
                    {project.dtm_created
                      ? new Date(project.dtm_created).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-left text-xs text-slate-300 sm:px-6 sm:py-4 sm:text-sm">
                    {project.dtm_modified
                      ? new Date(project.dtm_modified).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-3 py-3 text-right sm:px-6 sm:py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="group rounded-lg p-2 text-blue-500 transition-all duration-200 hover:bg-blue-500/20 hover:text-blue-300"
                        title="Edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(project);
                        }}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(project);
                        }}
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

