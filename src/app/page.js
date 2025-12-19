"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    created_by: "",
  });
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    modified_by: "",
  });

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("dtm_created", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("projects")
        .insert([
          {
            ...formData,
            modified_by: formData.created_by,
            dtm_created: now,
            dtm_modified: now,
          },
        ])
        .select();

      if (error) throw error;

      // Add new project to list and close modal
      setProjects((prev) => [data[0], ...prev]);
      setIsModalOpen(false);
      setFormData({
        name: "",
        description: "",
        created_by: "",
      });
      showNotification("Project created successfully!", "success");
    } catch (error) {
      console.error("Error creating project:", error.message);
      showNotification("Failed to create project. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      name: "",
      description: "",
      created_by: "",
    });
  };

  const openEditModal = (project) => {
    setProjectToEdit(project);
    setEditFormData({
      name: project.name || "",
      description: project.description || "",
      modified_by: "",
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setProjectToEdit(null);
    setEditFormData({
      name: "",
      description: "",
      modified_by: "",
    });
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!projectToEdit) return;

    try {
      setUpdating(true);
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("projects")
        .update({
          name: editFormData.name,
          description: editFormData.description,
          modified_by: editFormData.modified_by,
          dtm_modified: now,
        })
        .eq("id", projectToEdit.id)
        .select();

      if (error) throw error;

      // Update project in local state
      setProjects((prev) =>
        prev.map((p) => (p.id === projectToEdit.id ? data[0] : p))
      );
      closeEditModal();
      showNotification("Project updated successfully!", "success");
    } catch (error) {
      console.error("Error updating project:", error.message);
      showNotification("Failed to update project. Please try again.", "error");
    } finally {
      setUpdating(false);
    }
  };

  const openDeleteModal = (project) => {
    setProjectToDelete(project);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setProjectToDelete(null);
    setDeletePassword("");
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!projectToDelete) return;

    // Validate password
    const correctPassword = process.env.NEXT_PUBLIC_PROJECT_DELETE_PASSWORD;
    if (deletePassword !== correctPassword) {
      showNotification("Incorrect delete password. Please try again.", "error");
      return;
    }

    try {
      setDeleting(true);
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectToDelete.id);

      if (error) throw error;

      // Remove project from local state
      setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
      closeDeleteModal();
      showNotification("Project deleted successfully!", "delete");
    } catch (error) {
      console.error("Error deleting project:", error.message);
      showNotification("Failed to delete project. Please try again.", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 font-sans">
      {/* Notification */}
      {notification && (
        <div className="fixed inset-x-0 top-6 z-[100] flex justify-center animate-[fadeIn_0.2s_ease-out]">
          <div
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl ${
              notification.type === "success"
                ? "border-emerald-500/50 bg-emerald-500/20"
                : "border-red-500/50 bg-red-500/20"
            }`}
          >
            {/* Icon */}
            {notification.type === "success" ? (
              <svg
                className="h-5 w-5 text-emerald-400"
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
            ) : notification.type === "delete" ? (
              <svg
                className="h-5 w-5 text-red-400"
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
            ) : (
              <svg
                className="h-5 w-5 text-red-400"
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
            )}
            <span
              className={`font-medium ${
                notification.type === "success" ? "text-emerald-300" : "text-red-300"
              }`}
            >
              {notification.message}
            </span>
            {/* Close button */}
            <button
              onClick={() => setNotification(null)}
              className={`ml-2 rounded-lg p-1 transition-colors ${
                notification.type === "success"
                  ? "text-emerald-400 hover:bg-emerald-500/30 hover:text-emerald-200"
                  : "text-red-400 hover:bg-red-500/30 hover:text-red-200"
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
      )}

      {/* App Icon - Positioned at top right, spanning header and body */}
      <div className="fixed right-4 top-2 z-40 md:right-8">
        <Image
          src="/app-icon.png"
          alt="Expense Tracker"
          width={140}
          height={140}
          priority
          unoptimized
          className="cursor-pointer drop-shadow-2xl animate-[float_3s_ease-in-out_infinite] transition-all duration-300 hover:scale-110 hover:drop-shadow-[0_0_25px_rgba(16,185,129,0.6)] active:scale-105 active:drop-shadow-[0_0_35px_rgba(16,185,129,0.8)]"
        />
      </div>

      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-6 py-5">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              rw-expense-tracker
            </span>
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-8">
            <h2 className="mb-3 text-3xl font-semibold text-white">
              Track Your Expenses
            </h2>
            <p className="text-lg text-slate-400">
              Keep your finances organized and under control
            </p>
          </div>

          <button
            className="group relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/30 active:scale-100"
            onClick={openModal}
          >
            <svg
              className="h-5 w-5 transition-transform group-hover:scale-110"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
            Create tracker project
          </button>

          {/* Projects Table */}
          <div className="mt-12 w-full">
            <h3 className="mb-4 text-left text-xl font-semibold text-white">
              Your Projects
            </h3>
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
                            {/* Edit */}
                            <button
                              className="group rounded-lg p-2 text-blue-500 transition-all duration-200 hover:bg-blue-500/20 hover:text-blue-300"
                              title="Edit"
                              onClick={() => openEditModal(project)}
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

                            {/* Delete */}
                            <button
                              className="group rounded-lg p-2 text-red-500 transition-all duration-200 hover:bg-red-500/20 hover:text-red-300"
                              title="Delete"
                              onClick={() => openDeleteModal(project)}
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
        </div>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          ></div>

          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-700/50 bg-slate-800 p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                Create New Project
              </h2>
              <button
                onClick={closeModal}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
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

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Project Name */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Project Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter project name"
                  className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Enter project description"
                  className="w-full resize-none rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Created By */}
              <div>
                <label
                  htmlFor="created_by"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Created By <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="created_by"
                  name="created_by"
                  value={formData.created_by}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your name"
                  className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-lg border border-slate-600 px-4 py-3 font-medium text-slate-300 transition-colors hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 font-medium text-white transition-all hover:shadow-lg hover:shadow-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeEditModal}
          ></div>

          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-700/50 bg-slate-800 p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Edit Project</h2>
              <button
                onClick={closeEditModal}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
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

            <form onSubmit={handleEditSubmit} className="space-y-5">
              {/* Project Name */}
              <div>
                <label
                  htmlFor="edit_name"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Project Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="edit_name"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditInputChange}
                  required
                  placeholder="Enter project name"
                  className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="edit_description"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Description
                </label>
                <textarea
                  id="edit_description"
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditInputChange}
                  rows={3}
                  placeholder="Enter project description"
                  className="w-full resize-none rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Modified By */}
              <div>
                <label
                  htmlFor="edit_modified_by"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Modified By <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="edit_modified_by"
                  name="modified_by"
                  value={editFormData.modified_by}
                  onChange={handleEditInputChange}
                  required
                  placeholder="Enter your name"
                  className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 rounded-lg border border-slate-600 px-4 py-3 font-medium text-slate-300 transition-colors hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 font-medium text-white transition-all hover:shadow-lg hover:shadow-blue-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeDeleteModal}
          ></div>

          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-700/50 bg-slate-800 p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                Delete Project
              </h2>
              <button
                onClick={closeDeleteModal}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
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

            <form onSubmit={handleDelete}>
              <div className="mb-6">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-red-500/20 p-4">
                    <svg
                      className="h-8 w-8 text-red-500"
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
                  </div>
                </div>
                <p className="text-center text-slate-300">
                  Are you sure you want to delete the project{" "}
                  <span className="font-semibold text-white">
                    "{projectToDelete?.name}"
                  </span>
                  ?
                </p>
                <p className="mt-2 text-center text-sm text-slate-400">
                  This action cannot be undone.
                </p>
              </div>

              {/* Delete Password */}
              <div className="mb-6">
                <label
                  htmlFor="delete_password"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Delete Password <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  id="delete_password"
                  name="delete_password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  required
                  placeholder="Enter delete password"
                  className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 transition-colors focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="flex-1 rounded-lg border border-slate-600 px-4 py-3 font-medium text-slate-300 transition-colors hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleting}
                  className="flex-1 rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-4 py-3 font-medium text-white transition-all hover:shadow-lg hover:shadow-red-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
