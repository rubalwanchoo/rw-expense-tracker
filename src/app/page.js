"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

const STATIC_USERNAME = process.env.NEXT_PUBLIC_APP_USERNAME || "";
const STATIC_PASSWORD = process.env.NEXT_PUBLIC_APP_PASSWORD || "";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(null);

  // Clear session and load saved credentials on page load
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Clear login session
      localStorage.removeItem("app_logged_in");
      
      // Check for saved credentials
      const savedCredentials = localStorage.getItem("app_remembered_credentials");
      if (savedCredentials) {
        try {
          const { username, password } = JSON.parse(savedCredentials);
          setForm({ username: username || "", password: password || "" });
          setRememberMe(true);
        } catch (e) {
          console.error("Error loading saved credentials:", e);
        }
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      form.username.trim() === STATIC_USERNAME &&
      form.password === STATIC_PASSWORD
    ) {
      localStorage.setItem("app_logged_in", "true");
      localStorage.setItem("app_username", form.username.trim());
      
      // Save or clear credentials based on Remember Me
      if (rememberMe) {
        localStorage.setItem(
          "app_remembered_credentials",
          JSON.stringify({ username: form.username, password: form.password })
        );
      } else {
        localStorage.removeItem("app_remembered_credentials");
      }
      
      setError(null);
      router.replace("/dashboard");
    } else {
      setError("Invalid login");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <Header />
      <main className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4 sm:px-6">
        <div className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-xl sm:p-8">
          <h2 className="mb-6 text-xl font-semibold text-gray-800 sm:text-2xl">Sign in</h2>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="login_username"
                className="mb-2 block text-sm font-medium text-gray-600"
              >
                Username
              </label>
              <input
                id="login_username"
                name="username"
                type="text"
                value={form.username}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-800 placeholder-gray-400 transition-colors focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Enter username"
              />
        </div>
            <div>
              <label
                htmlFor="login_password"
                className="mb-2 block text-sm font-medium text-gray-600"
              >
                Password
              </label>
              <input
                id="login_password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-800 placeholder-gray-400 transition-colors focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Enter password"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="remember_me"
                name="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border-gray-300 bg-gray-50 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0"
              />
              <label
                htmlFor="remember_me"
                className="cursor-pointer text-sm text-gray-600"
              >
                Remember me
              </label>
            </div>
            {error && (
              <p className="text-sm font-medium text-red-500">{error}</p>
            )}
            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-xl hover:shadow-emerald-500/30"
          >
              Login
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
