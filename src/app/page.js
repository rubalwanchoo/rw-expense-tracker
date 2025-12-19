"use client";

import { useState, useEffect } from "react";
import {
  fetchProjects as fetchProjectsService,
  createProject,
  updateProject,
  deleteProject,
} from "@/lib/projects";
import Notification from "@/components/Notification";
import AppIcon from "@/components/AppIcon";
import Header from "@/components/Header";
import CreateProjectButton from "@/components/CreateProjectButton";
import ProjectsTable from "@/components/ProjectsTable";
import CreateProjectModal from "@/components/modals/CreateProjectModal";
import EditProjectModal from "@/components/modals/EditProjectModal";
import DeleteProjectModal from "@/components/modals/DeleteProjectModal";

export default function Home() {
  // State Management
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

  // Notification handler
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

  // Data fetching logic
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await fetchProjectsService();
      if (error) throw error;
      setProjects(data);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 font-sans">
      <Notification
        notification={notification}
        onClose={() => setNotification(null)}
      />
      <AppIcon />
      <Header />

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

          <CreateProjectButton onClick={openModal} />

          <ProjectsTable
            projects={projects}
            loading={loading}
            onEdit={openEditModal}
            onDelete={openDeleteModal}
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
      />
    </div>
  );
}
