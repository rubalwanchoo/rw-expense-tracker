"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";

export default function Header({ showLogout = false, onLogout }) {
  const [username, setUsername] = useState("");
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUsername = localStorage.getItem("app_username");
      if (storedUsername) {
        setUsername(storedUsername);
      }
    }
  }, []);

  return (
    <header className="border-b shadow-sm transition-colors duration-300" style={{ backgroundColor: 'var(--header-bg)', borderColor: 'var(--header-border)' }}>
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* RW Coin Icon */}
          <div 
            className="relative flex h-9 w-9 items-center justify-center rounded-full sm:h-11 sm:w-11"
            style={{ 
              background: 'linear-gradient(145deg, #fcd34d 0%, #f59e0b 25%, #d97706 50%, #b45309 75%, #92400e 100%)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
            }}
          >
            {/* Inner ring */}
            <div 
              className="absolute inset-[3px] rounded-full sm:inset-1"
              style={{
                border: '1.5px solid rgba(255, 255, 255, 0.3)',
                boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.2)',
              }}
            />
            {/* Decorative dots */}
            <div className="absolute inset-[5px] rounded-full sm:inset-[6px]" style={{ border: '1px dotted rgba(255, 255, 255, 0.2)' }} />
            {/* Letters */}
            <span 
              className="relative z-10 text-sm font-black sm:text-base"
              style={{ 
                fontFamily: 'Georgia, serif',
                color: '#78350f',
                textShadow: '0 1px 0 rgba(255, 255, 255, 0.4)',
                letterSpacing: '-0.5px',
              }}
            >
              rw
            </span>
          </div>
          <h1 className="text-lg font-bold tracking-tight sm:text-2xl">
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-400">
              rw-expense-tracker
            </span>
          </h1>
        </div>
        {showLogout && (
          <div className="ml-auto flex flex-col items-end gap-1 text-right">
            {username && (
              <span className="text-xs sm:text-sm" style={{ color: 'var(--muted)' }}>
                Hi, <span className="font-medium" style={{ color: 'var(--accent-light)' }}>{username}</span>
              </span>
            )}
            {/* Theme Toggle Switch */}
            <div className="flex items-center gap-2 py-1">
              <span className="text-[10px] font-medium sm:text-xs" style={{ color: 'var(--muted)' }}>
                {theme === "light" ? "Light" : "Dark"}
              </span>
              <button
                onClick={toggleTheme}
                className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 sm:h-6 sm:w-11"
                style={{ 
                  backgroundColor: theme === "dark" ? 'var(--accent)' : '#d1d5db'
                }}
                aria-label="Toggle theme"
              >
                <span
                  className={`inline-flex h-3.5 w-3.5 transform items-center justify-center rounded-full bg-white shadow-md transition-transform duration-300 sm:h-4 sm:w-4 ${
                    theme === "dark" ? "translate-x-5 sm:translate-x-6" : "translate-x-1"
                  }`}
                >
                  {theme === "light" ? (
                    <svg className="h-2 w-2 text-amber-500 sm:h-2.5 sm:w-2.5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg className="h-2 w-2 text-slate-700 sm:h-2.5 sm:w-2.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                  )}
                </span>
              </button>
            </div>
            <button
              onClick={onLogout}
              className="rounded-md px-2 py-1 text-xs font-semibold transition-all duration-300 hover:scale-105 active:scale-100 sm:px-3 sm:py-1.5 sm:text-sm"
              style={{ color: 'var(--accent-light)' }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
