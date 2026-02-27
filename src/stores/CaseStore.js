import CaseService from '@/service/CaseService';
import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * @typedef {Object} CaseRecord
 * @property {string} id - Unique ID of the case
 * @property {string} name - Name of the case
 * @property {Date|null} created - Date when the case was created
 * @property {Date|null} updated - Date when the case was last updated
 * @property {string} type - Resource type (e.g., 'Case')
 */

/**
 * Store for managing case metadata and CRUD operations.
 * Coordinates with CaseService to persist changes to the backend.
 */
export const useCaseStore = defineStore('case', () => {
  /** @type {import('vue').Ref<CaseRecord[]>} List of all available cases */
  const cases = ref([]);

  /** @type {import('vue').Ref<number>} Total number of cases found */
  const totalRecords = ref(0);

  /** @type {import('vue').Ref<boolean>} Loading state for case-related operations */
  const loading = ref(false);

  /**
   * Loads all cases from the backend.
   * @returns {Promise<void>}
   */
  const loadCases = async () => {
    loading.value = true;
    try {
      const response = await CaseService.getCases();
      cases.value = response.data.map(item => ({
        ...item,
        created: item.created ? new Date(item.created) : null,
        updated: item.updated ? new Date(item.updated) : null,
      }));
      totalRecords.value = response.totalCount || response.data.length;
    } catch (error) {
      console.error('Failed to load cases:', error);
    } finally {
      loading.value = false;
    }
  };

  /**
   * Creates a new case record.
   * @param {Partial<CaseRecord>} data - The case metadata
   * @returns {Promise<CaseRecord>} The created case record
   */
  const createCase = async data => {
    data.created = new Date().toISOString();
    data.updated = data.created;
    data.type = 'Case';
    try {
      const response = await CaseService.createCase(data);
      if (response.data.created) response.data.created = new Date(response.data.created);
      if (response.data.updated) response.data.updated = new Date(response.data.updated);
      cases.value = [response.data, ...cases.value];
      totalRecords.value++;
      return response.data;
    } catch (e) {
      console.error('Failed to create case:', e);
      throw e;
    }
  };

  /**
   * Updates an existing case's metadata.
   * @param {string} id - The ID of the case to update
   * @param {Object} data - The patch data to apply
   * @returns {Promise<CaseRecord>} The updated case record
   */
  const updateCase = async (id, data) => {
    data.updated = new Date().toISOString();
    try {
      const response = await CaseService.updateCase(id, data);
      if (response.data.created) response.data.created = new Date(response.data.created);
      if (response.data.updated) response.data.updated = new Date(response.data.updated);
      const index = cases.value.findIndex(c => c.id === id);
      if (index !== -1) {
        cases.value[index] = response.data;
        cases.value = [...cases.value];
      }
      return response.data;
    } catch (e) {
      console.error('Failed to update case:', e);
      throw e;
    }
  };

  /**
   * Deletes a case record by ID.
   * @param {string} id - The ID of the case to delete
   * @returns {Promise<void>}
   */
  const deleteCase = async id => {
    try {
      await CaseService.deleteCase(id);
      cases.value = cases.value.filter(c => c.id !== id);
      totalRecords.value--;
    } catch (e) {
      console.error('Failed to delete case:', e);
      throw e;
    }
  };

  return {
    cases,
    totalRecords,
    loading,
    loadCases,
    createCase,
    updateCase,
    deleteCase,
  };
});
