"use client";

export default function Notification({ notification, onClose }) {
  if (!notification) return null;

  const getIcon = () => {
    if (notification.type === "success") {
      return (
        <svg
          className="h-5 w-5 text-emerald-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    } else if (notification.type === "delete") {
      return (
        <svg
          className="h-5 w-5 text-red-600"
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
      );
    } else {
      return (
        <svg
          className="h-5 w-5 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    }
  };

  return (
    <div className="fixed inset-x-0 top-6 z-[100] flex justify-center animate-[fadeIn_0.2s_ease-out]">
      <div
        className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg transition-colors duration-300 ${
          notification.type === "success"
            ? "border-emerald-200 dark:border-emerald-700"
            : "border-red-200 dark:border-red-700"
        }`}
        style={{ backgroundColor: 'var(--card-bg)' }}
      >
        {getIcon()}
        <span
          className={`font-medium ${
            notification.type === "success" ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"
          }`}
        >
          {notification.message}
        </span>
        <button
          onClick={onClose}
          className={`ml-2 rounded-lg p-1 transition-colors ${
            notification.type === "success"
              ? "text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
              : "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
          }`}
        >
          <svg
            className="h-4 w-4"
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
    </div>
  );
}
