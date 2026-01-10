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
    <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
        <h1 className="text-lg font-bold tracking-tight text-white sm:text-2xl">
          <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            rw-expense-tracker
          </span>
        </h1>
        <div className="flex items-center gap-2 sm:gap-4">
          {showLogout && (
            <div className="flex flex-col items-end gap-1">
              {username && (
                <span className="text-xs text-slate-400 sm:text-sm">
                  Hi, <span className="font-medium text-emerald-400">{username}</span>
                </span>
              )}
              <button
                onClick={onLogout}
                className="rounded-md px-2 py-1 text-xs font-semibold text-emerald-300 transition-all duration-300 hover:scale-105 hover:bg-emerald-500/20 hover:text-emerald-200 hover:shadow-[0_0_12px_rgba(16,185,129,0.4)] active:scale-100 sm:px-3 sm:py-1.5 sm:text-sm"
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
