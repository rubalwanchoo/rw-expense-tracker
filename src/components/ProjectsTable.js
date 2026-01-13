"use client";

import { useRouter } from "next/navigation";
import FilterBox from "./FilterBox";
import { formatDateEST } from "@/lib/dateUtils";

// Category color mapping (same as TransactionsTable)
const CATEGORY_COLORS = {
  Payment: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Groceries: "bg-green-100 text-green-700 border-green-200",
  Dining: "bg-orange-100 text-orange-700 border-orange-200",
  Gas: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Shopping: "bg-pink-100 text-pink-700 border-pink-200",
  Entertainment: "bg-purple-100 text-purple-700 border-purple-200",
  Travel: "bg-blue-100 text-blue-700 border-blue-200",
  Utilities: "bg-cyan-100 text-cyan-700 border-cyan-200",
  Healthcare: "bg-rose-100 text-rose-700 border-rose-200",
  Other: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function ProjectsTable({
  projects,
  projectTotals = {},
  loading,
  filterText,
  onFilterChange,
  onEdit,
  onDelete,
  onAnalyze,
}) {
  const router = useRouter();

  const handleRowClick = (project) => {
    router.push(`/dashboard/transactions/${project.id}`);
  };

  return (
    <div className="mx-auto mt-8 w-full max-w-2xl sm:mt-10">
      <div className="mb-3 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-left text-base font-semibold text-gray-800 sm:text-lg">Your Projects</h3>
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
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
        {loading ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
            <p className="text-sm text-gray-500">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8">
            <svg
              className="h-10 w-10 text-gray-300"
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
            <p className="text-sm text-gray-500">No projects created yet</p>
            <p className="text-xs text-gray-400">
              Click the button above to create your first project
            </p>
          </div>
        ) : (
          <div>
            {projects.map((project, index) => (
              <div
                key={project.id}
                onClick={() => handleRowClick(project)}
                className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-3 transition-all duration-200 hover:bg-gray-50 sm:px-4 ${
                  index !== projects.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                {/* Project Info - Stacked, Left Aligned */}
                <div className="flex-1 space-y-1 text-left">
                  {/* Project Name */}
                  <p className="text-sm font-semibold text-gray-800">
                    Project - {project.name}
                  </p>
                  {/* Description */}
                  <p className="text-xs text-gray-500 line-clamp-1">
                    {project.description || "No description"}
                  </p>
                  {/* Payment/Expenses Labels */}
                  <div className="flex gap-2">
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600 border border-emerald-100">
                      Payments: ${(projectTotals[project.id]?.payments || 0).toFixed(2)}
                    </span>
                    <span className="rounded bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600 border border-red-100">
                      Expenses: ${(projectTotals[project.id]?.expenses || 0).toFixed(2)}
                    </span>
                  </div>
                  {/* Created/Updated info (EST) */}
                  <div className="flex gap-3 text-[10px] text-gray-400">
                    <span>Created: {formatDateEST(project.dtm_created)}</span>
                    <span>Updated: {formatDateEST(project.dtm_modified)}</span>
                  </div>
                  {/* Category Badges (excluding Payment) */}
                  {projectTotals[project.id]?.categories?.filter(c => c !== "Payment").length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {projectTotals[project.id].categories
                        .filter((category) => category !== "Payment")
                        .map((category) => (
                        <span
                          key={category}
                          className={`text-[8px] font-medium px-1.5 py-0.5 rounded-full border ${
                            CATEGORY_COLORS[category] || CATEGORY_COLORS.Other
                          }`}
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {/* Analyze Button */}
                  {onAnalyze && (
                    <button
                      className="group rounded-md p-1.5 text-purple-500 transition-all duration-200 hover:bg-purple-50 hover:text-purple-600"
                      title="Analyze"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAnalyze(project);
                      }}
                    >
                      <svg
                        className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    </button>
                  )}
                  {/* Edit Button */}
                  <button
                    className="group rounded-md p-1.5 text-blue-500 transition-all duration-200 hover:bg-blue-50 hover:text-blue-600"
                    title="Edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(project);
                    }}
                  >
                    <svg
                      className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
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
                  {/* Delete Button */}
                  <button
                    className="group rounded-md p-1.5 text-red-500 transition-all duration-200 hover:bg-red-50 hover:text-red-600"
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(project);
                    }}
                  >
                    <svg
                      className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
