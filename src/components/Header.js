"use client";

import { useState, useEffect } from "react";

export default function Header({ showLogout = false, onLogout }) {
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUsername = localStorage.getItem("app_username");
      if (storedUsername) {
        setUsername(storedUsername);
      }
    }
  }, []);

  return (
    <header className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
        <h1 className="text-lg font-bold tracking-tight text-gray-800 sm:text-2xl">
          <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            rw-expense-tracker
          </span>
        </h1>
        <div className="flex items-center gap-2 sm:gap-4">
          {showLogout && (
            <div className="flex flex-col items-end gap-1">
              {username && (
                <span className="text-xs text-gray-500 sm:text-sm">
                  Hi, <span className="font-medium text-emerald-600">{username}</span>
                </span>
              )}
              <button
                onClick={onLogout}
                className="rounded-md px-2 py-1 text-xs font-semibold text-emerald-600 transition-all duration-300 hover:scale-105 hover:bg-emerald-50 hover:text-emerald-700 active:scale-100 sm:px-3 sm:py-1.5 sm:text-sm"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
