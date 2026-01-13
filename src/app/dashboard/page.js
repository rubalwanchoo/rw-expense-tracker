"use client";

import { useState, useEffect } from "react";
import {
  fetchProjects as fetchProjectsService,
  createProject,
  updateProject,
  deleteProject,
} from "@/lib/projects";
import { fetchProjectTotals, fetchTransactions } from "@/lib/transactions";
import Notification from "@/components/Notification";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CreateProjectButton from "@/components/CreateProjectButton";
import ProjectsTable from "@/components/ProjectsTable";
import CreateProjectModal from "@/components/modals/CreateProjectModal";
import EditProjectModal from "@/components/modals/EditProjectModal";
import DeleteProjectModal from "@/components/modals/DeleteProjectModal";
import AnalyticsModal from "@/components/modals/AnalyticsModal";

import { useRouter } from "next/navigation";

export default function DashboardPage() {
  // State Management
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [projects, setProjects] = useState([]);
  const [projectTotals, setProjectTotals] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [filterText, setFilterText] = useState("");
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
  
  // Analytics modal state
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [analyticsTransactions, setAnalyticsTransactions] = useState([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Notification handler
  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Fetch projects on component mount
  useEffect(() => {
    const authed =
      typeof window !== "undefined" &&
      localStorage.getItem("app_logged_in") === "true";
    if (!authed) {
      router.replace("/");
      return;
    }
    setLoggedIn(true);
    fetchProjects();
  }, [router]);

  // Data fetching logic
  const fetchProjects = async () => {
    try {
      setLoading(true);
      // Fetch projects and totals in parallel
      const [projectsResult, totalsResult] = await Promise.all([
        fetchProjectsService(),
        fetchProjectTotals(),
      ]);
      
      if (projectsResult.error) throw projectsResult.error;
      setProjects(projectsResult.data);
      setProjectTotals(totalsResult.data || {});
    } catch (error) {
      console.error("Error fetching projects:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (e) => {
    setFilterText(e.target.value);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Modal handlers
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

  const openDeleteModal = (project) => {
    setProjectToDelete(project);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setProjectToDelete(null);
    setDeletePassword("");
  };

  // Analytics modal handler
  const openAnalyticsModal = async (project) => {
    try {
      setLoadingAnalytics(true);
      setIsAnalyticsModalOpen(true);
      
      // Fetch transactions for the selected project
      const { data, error } = await fetchTransactions(project.id);
      if (error) throw error;
      
      setAnalyticsTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions for analytics:", error.message);
      showNotification("Failed to load analytics data.", "error");
      setIsAnalyticsModalOpen(false);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const closeAnalyticsModal = () => {
    setIsAnalyticsModalOpen(false);
    setAnalyticsTransactions([]);
  };

  // CRUD operations
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const { data, error } = await createProject(formData);

      if (error) throw error;

      setProjects((prev) => [data, ...prev]);
      closeModal();
      showNotification("Project created successfully!", "success");
    } catch (error) {
      console.error("Error creating project:", error.message);
      showNotification("Failed to create project. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!projectToEdit) return;

    try {
      setUpdating(true);
      const { data, error } = await updateProject(
        projectToEdit.id,
        editFormData
      );

      if (error) throw error;

      setProjects((prev) =>
        prev.map((p) => (p.id === projectToEdit.id ? data : p))
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

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!projectToDelete) return;

    // Check if project has transactions
    const hasTransactions =
      (projectTotals[projectToDelete.id]?.payments || 0) > 0 ||
      (projectTotals[projectToDelete.id]?.expenses || 0) > 0;

    if (hasTransactions) {
      showNotification("Please delete all transactions first before deleting this project.", "error");
      return;
    }

    // Validate password
    const correctPassword = process.env.NEXT_PUBLIC_PROJECT_DELETE_PASSWORD;
    if (deletePassword !== correctPassword) {
      showNotification("Incorrect delete password. Please try again.", "error");
      return;
    }

    try {
      setDeleting(true);
      const { success, error } = await deleteProject(projectToDelete.id);

      if (error) throw error;
      if (!success) throw new Error("Delete operation failed");

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

  // Derived filtered projects (sorted by created date, newest first)
  const filteredProjects = (() => {
    let result =
      filterText.trim().length === 0
        ? [...projects]
        : projects.filter((project) => {
            const query = filterText.toLowerCase();
            const name = project.name?.toLowerCase() || "";
            const description = project.description?.toLowerCase() || "";
            return name.includes(query) || description.includes(query);
          });

    // Sort by created date (newest first)
    result.sort((a, b) => {
      const aVal = a.dtm_created || "";
      const bVal = b.dtm_created || "";
      return bVal.localeCompare(aVal); // Descending order
    });

    return result;
  })();

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("app_logged_in");
    }
    setLoggedIn(false);
    router.replace("/");
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <Notification
        notification={notification}
        onClose={() => setNotification(null)}
      />
      <Header showLogout onLogout={handleLogout} />

      <main className="relative mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-16">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-6 sm:mb-8">
            <h2 className="mb-2 text-2xl font-semibold text-gray-800 sm:mb-3 sm:text-3xl">
              Track Your Expenses
            </h2>
            <p className="text-base text-gray-500 sm:text-lg">
              Keep your finances organized and under control
            </p>
          </div>

          <CreateProjectButton onClick={openModal} />

          <ProjectsTable
            projects={filteredProjects}
            projectTotals={projectTotals}
            loading={loading}
            filterText={filterText}
            onFilterChange={handleFilterChange}
            onEdit={openEditModal}
            onDelete={openDeleteModal}
            onAnalyze={openAnalyticsModal}
          />
        </div>
      </main>

      <CreateProjectModal
        isOpen={isModalOpen}
        formData={formData}
        saving={saving}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onInputChange={handleInputChange}
      />

      <EditProjectModal
        isOpen={isEditModalOpen}
        project={projectToEdit}
        formData={editFormData}
        updating={updating}
        onClose={closeEditModal}
        onSubmit={handleEditSubmit}
        onInputChange={handleEditInputChange}
      />

      <DeleteProjectModal
        isOpen={isDeleteModalOpen}
        project={projectToDelete}
        deletePassword={deletePassword}
        deleting={deleting}
        onClose={closeDeleteModal}
        onSubmit={handleDelete}
        onPasswordChange={(e) => setDeletePassword(e.target.value)}
        hasTransactions={
          projectToDelete
            ? (projectTotals[projectToDelete.id]?.payments || 0) > 0 ||
              (projectTotals[projectToDelete.id]?.expenses || 0) > 0
            : false
        }
      />

      {/* Analytics Modal */}
      <AnalyticsModal
        isOpen={isAnalyticsModalOpen}
        onClose={closeAnalyticsModal}
        transactions={analyticsTransactions}
      />

      {/* Loading overlay for analytics */}
      {loadingAnalytics && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gray-900/60 backdrop-blur-sm">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-2xl">
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
              <p className="mt-4 text-lg font-medium text-purple-600">
                Loading analytics...
              </p>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
