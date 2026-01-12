import { supabase } from "./supabase";
import { touchProjectModified } from "./projects";

/**
 * Fetch transaction totals (income/expenses) for all projects
 * @returns {Promise<{data: Object, error: Error|null}>}
 * Returns an object keyed by project_id with {income, expenses} totals
 */
export const fetchProjectTotals = async () => {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("project_id, type, amount");

    if (error) throw error;

    // Aggregate totals by project
    const totals = {};
    (data || []).forEach((t) => {
      const projectId = t.project_id;
      if (!projectId) return; // Skip if no project_id
      
      if (!totals[projectId]) {
        totals[projectId] = { income: 0, expenses: 0 };
      }
      
      const amount = parseFloat(t.amount) || 0;
      const type = (t.type || "").toLowerCase();
      
      if (type === "income") {
        totals[projectId].income += amount;
      } else {
        totals[projectId].expenses += amount;
      }
    });

    return { data: totals, error: null };
  } catch (error) {
    console.error("Error fetching project totals:", error.message);
    return { data: {}, error };
  }
};

/**
 * Fetch all transactions for a specific project from Supabase
 * @param {string} projectId - The project ID to fetch transactions for
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export const fetchTransactions = async (projectId) => {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("project_id", projectId)
      .order("trans_date", { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error("Error fetching transactions:", error.message);
    return { data: [], error };
  }
};

/**
 * Create a new transaction in Supabase
 * @param {Object} transactionData - Transaction data object
 * @param {string} transactionData.project_id - Project ID
 * @param {string} transactionData.trans_date - Transaction date
 * @param {number} transactionData.amount - Transaction amount
 * @param {string} transactionData.description - Transaction description
 * @param {string} transactionData.source - Payment source
 * @param {string} username - Logged in username
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const createTransaction = async (transactionData, username = "system") => {
  try {
    const now = new Date().toISOString();
    const user = username || "system"; // Ensure never null
    const { data, error } = await supabase
      .from("transactions")
      .insert([
        {
          project_id: transactionData.project_id,
          trans_date: transactionData.trans_date,
          amount: parseFloat(transactionData.amount),
          type: transactionData.type,
          description: transactionData.description,
          source: transactionData.source,
          category: transactionData.category || "Other", // Never null
          dtm_created: now,
          dtm_modified: now,
          created_by: user,
          modified_by: user,
        },
      ])
      .select();

    if (error) throw error;
    
    // Update the project's dtm_modified timestamp
    await touchProjectModified(transactionData.project_id);
    
    return { data: data[0], error: null };
  } catch (error) {
    console.error("Error creating transaction:", error.message);
    return { data: null, error };
  }
};

/**
 * Update an existing transaction in Supabase
 * @param {string} transactionId - Transaction ID to update
 * @param {Object} updateData - Updated transaction data
 * @param {string} username - Logged in username
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const updateTransaction = async (transactionId, updateData, username = "system") => {
  try {
    const now = new Date().toISOString();
    const user = username || "system"; // Ensure never null
    const { data, error } = await supabase
      .from("transactions")
      .update({
        trans_date: updateData.trans_date,
        amount: parseFloat(updateData.amount),
        type: updateData.type,
        description: updateData.description,
        source: updateData.source,
        category: updateData.category || "Other", // Never null
        dtm_modified: now,
        modified_by: user,
      })
      .eq("id", transactionId)
      .select();

    if (error) throw error;
    return { data: data[0], error: null };
  } catch (error) {
    console.error("Error updating transaction:", error.message);
    return { data: null, error };
  }
};

/**
 * Delete a transaction from Supabase
 * @param {string} transactionId - Transaction ID to delete
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export const deleteTransaction = async (transactionId) => {
  try {
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", transactionId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error("Error deleting transaction:", error.message);
    return { success: false, error };
  }
};

/**
 * Delete multiple transactions from Supabase
 * @param {string[]} transactionIds - Array of transaction IDs to delete
 * @param {string} projectId - Project ID to update modified timestamp
 * @returns {Promise<{successCount: number, errorCount: number, error: Error|null}>}
 */
export const deleteMultipleTransactions = async (transactionIds, projectId) => {
  let successCount = 0;
  let errorCount = 0;

  try {
    // Delete all transactions in one query using 'in' filter
    const { error } = await supabase
      .from("transactions")
      .delete()
      .in("id", transactionIds);

    if (error) throw error;
    
    successCount = transactionIds.length;
    
    // Update the project's dtm_modified timestamp
    if (projectId) {
      await touchProjectModified(projectId);
    }
    
    return { successCount, errorCount: 0, error: null };
  } catch (error) {
    console.error("Error deleting multiple transactions:", error.message);
    return { successCount: 0, errorCount: transactionIds.length, error };
  }
};
