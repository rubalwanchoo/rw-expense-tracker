import { supabase } from "./supabase";

/**
 * Fetch all projects from Supabase, ordered by creation date (newest first)
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export const fetchProjects = async () => {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("dtm_created", { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error("Error fetching projects:", error.message);
    return { data: [], error };
  }
};

/**
 * Create a new project in Supabase
 * @param {Object} projectData - Project data object
 * @param {string} projectData.name - Project name
 * @param {string} projectData.description - Project description
 * @param {string} projectData.created_by - Creator name
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const createProject = async (projectData) => {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("projects")
      .insert([
        {
          name: projectData.name,
          description: projectData.description,
          created_by: projectData.created_by,
          modified_by: projectData.created_by,
          dtm_created: now,
          dtm_modified: now,
        },
      ])
      .select();

    if (error) throw error;
    return { data: data[0], error: null };
  } catch (error) {
    console.error("Error creating project:", error.message);
    return { data: null, error };
  }
};

/**
 * Update an existing project in Supabase
 * @param {string} projectId - Project ID to update
 * @param {Object} updateData - Updated project data
 * @param {string} updateData.name - Updated project name
 * @param {string} updateData.description - Updated project description
 * @param {string} updateData.modified_by - Modifier name
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const updateProject = async (projectId, updateData) => {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("projects")
      .update({
        name: updateData.name,
        description: updateData.description,
        modified_by: updateData.modified_by,
        dtm_modified: now,
      })
      .eq("id", projectId)
      .select();

    if (error) throw error;
    return { data: data[0], error: null };
  } catch (error) {
    console.error("Error updating project:", error.message);
    return { data: null, error };
  }
};

/**
 * Delete a project from Supabase
 * @param {string} projectId - Project ID to delete
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export const deleteProject = async (projectId) => {
  try {
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error("Error deleting project:", error.message);
    return { success: false, error };
  }
};

