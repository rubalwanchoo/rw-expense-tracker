"use client";

import { useRouter } from "next/navigation";
import FilterBox from "./FilterBox";
import { formatDateEST } from "@/lib/dateUtils";

// Category color mapping - using hex colors for inline styles (works reliably on mobile)
const CATEGORY_STYLES = {
  Payment: { color: "#059669", borderColor: "#059669" },
  Groceries: { color: "#16a34a", borderColor: "#16a34a" },
  Dining: { color: "#ea580c", borderColor: "#ea580c" },
  Gas: { color: "#ca8a04", borderColor: "#ca8a04" },
  Shopping: { color: "#db2777", borderColor: "#db2777" },
  Entertainment: { color: "#9333ea", borderColor: "#9333ea" },
  Travel: { color: "#2563eb", borderColor: "#2563eb" },
  Utilities: { color: "#0891b2", borderColor: "#0891b2" },
  Healthcare: { color: "#e11d48", borderColor: "#e11d48" },
  Other: { color: "#4b5563", borderColor: "#4b5563" },
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
        <h3 className="text-left text-base font-semibold sm:text-lg" style={{ color: 'var(--foreground)' }}>Your Projects</h3>
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
      <div className="overflow-hidden rounded-xl border shadow-lg transition-colors duration-300" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
        {loading ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8">
            <svg
              className="h-10 w-10"
              style={{ color: 'var(--muted-light)' }}
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
            <p className="text-sm" style={{ color: 'var(--muted)' }}>No projects created yet</p>
            <p className="text-xs" style={{ color: 'var(--muted-light)' }}>
              Click the button above to create your first project
            </p>
          </div>
        ) : (
          <div>
            {projects.map((project, index) => (
              <div
                key={project.id}
                onClick={() => handleRowClick(project)}
                className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-3 transition-all duration-200 sm:px-4 ${
                  index !== projects.length - 1 ? "border-b border-gray-100 dark:border-slate-700" : ""
                }`}
              >
                {/* Project Info - Stacked, Left Aligned */}
                <div className="flex-1 space-y-1 text-left">
                  {/* Project Name */}
                  <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                    Project - {project.name}
                  </p>
                  {/* Description */}
                  <p className="text-xs line-clamp-1" style={{ color: 'var(--muted)' }}>
                    {project.description || "No description"}
                  </p>
                  {/* Payment/Expenses Labels */}
                  <div className="flex flex-wrap gap-2">
                    <span 
                      className="rounded-md px-2.5 py-1 text-[10px] font-bold border-2 dark:bg-emerald-900/30"
                      style={{ backgroundColor: 'transparent', color: '#059669', borderColor: '#059669' }}
                    >
                      Payments: ${(projectTotals[project.id]?.payments || 0).toFixed(2)}
                    </span>
                    <span 
                      className="rounded-md px-2.5 py-1 text-[10px] font-bold border-2 dark:bg-red-900/30"
                      style={{ backgroundColor: 'transparent', color: '#dc2626', borderColor: '#dc2626' }}
                    >
                      Expenses: ${(projectTotals[project.id]?.expenses || 0).toFixed(2)}
                    </span>
                  </div>
                  {/* Created/Updated info (EST) */}
                  <div className="flex gap-3 text-[10px]" style={{ color: 'var(--muted-light)' }}>
                    <span>Created: {formatDateEST(project.dtm_created)}</span>
                    <span>Updated: {formatDateEST(project.dtm_modified)}</span>
                  </div>
                  {/* Category Badges (excluding Payment) */}
                  {projectTotals[project.id]?.categories?.filter(c => c !== "Payment").length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {projectTotals[project.id].categories
                        .filter((category) => category !== "Payment")
                        .map((category) => {
                          const catStyle = CATEGORY_STYLES[category] || CATEGORY_STYLES.Other;
                          return (
                            <span
                              key={category}
                              className="text-[9px] font-bold px-2 py-0.5 rounded-md border-2 dark:bg-opacity-30"
                              style={{ 
                                backgroundColor: 'transparent', 
                                color: catStyle.color, 
                                borderColor: catStyle.borderColor 
                              }}
                            >
                              {category}
                            </span>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {/* Analyze Button */}
                  {onAnalyze && (
                    <button
                      className="group rounded-md p-1.5 text-purple-700 transition-all duration-200 hover:bg-purple-100 hover:text-purple-800 dark:text-purple-400 dark:hover:bg-purple-900/30 dark:hover:text-purple-300"
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
                    className="group rounded-md p-1.5 text-blue-700 transition-all duration-200 hover:bg-blue-100 hover:text-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-300"
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
                    className="group rounded-md p-1.5 text-red-700 transition-all duration-200 hover:bg-red-100 hover:text-red-800 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300"
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
