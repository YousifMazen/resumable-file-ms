import CollectionService from '@/service/CollectionService';
import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * @typedef {Object} CollectionRecord
 * @property {string} id - Unique ID of the collection
 * @property {string} name - Name of the collection
 * @property {string} caseId - ID of the case this collection belongs to
 * @property {Date|null} created - Date when the collection was created
 * @property {Date|null} updated - Date when the collection was last updated
 * @property {string} type - Resource type (e.g., 'Collection')
 * @property {string} [status] - Optional status of the collection
 */

/**
 * Store for managing file collections within cases.
 * Handles fetching, creating, updating, and deleting collection metadata.
 */
export const useCollectionStore = defineStore('collection', () => {
  /** @type {import('vue').Ref<CollectionRecord[]>} List of collections for the active case */
  const collections = ref([]);

  /** @type {import('vue').Ref<number>} Total number of collections found */
  const totalRecords = ref(0);

  /** @type {import('vue').Ref<boolean>} Loading state for collection-related operations */
  const loading = ref(false);

  /**
   * Loads all collections associated with a specific case.
   * @param {string} caseId - The ID of the case to fetch collections for
   * @returns {Promise<void>}
   */
  const loadCollections = async caseId => {
    loading.value = true;
    try {
      const response = await CollectionService.getCollectionsByCase(caseId);
      collections.value = response.data.map(item => ({
        ...item,
        created: item.created ? new Date(item.created) : null,
        updated: item.updated ? new Date(item.updated) : null,
      }));
      totalRecords.value = response.totalCount || response.data.length;
    } catch (error) {
      console.error('Failed to load collections:', error);
    } finally {
      loading.value = false;
    }
  };

  /**
   * Creates a new collection record.
   * @param {string} caseId - The case ID to associate this collection with
   * @param {Partial<CollectionRecord>} data - The collection metadata
   * @returns {Promise<CollectionRecord>} The created collection record
   */
  const createCollection = async (caseId, data) => {
    data.created = new Date().toISOString();
    data.updated = data.created;
    data.caseId = caseId;
    data.type = 'Collection';
    try {
      const response = await CollectionService.createCollection(data);
      if (response.data.created) response.data.created = new Date(response.data.created);
      if (response.data.updated) response.data.updated = new Date(response.data.updated);
      collections.value = [response.data, ...collections.value];
      totalRecords.value++;
      return response.data;
    } catch (e) {
      console.error('Failed to create collection:', e);
      throw e;
    }
  };

  /**
   * Updates an existing collection's metadata.
   * @param {string} id - The ID of the collection to update
   * @param {Object} data - The patch data to apply
   * @returns {Promise<CollectionRecord>} The updated collection record
   */
  const updateCollection = async (id, data) => {
    data.updated = new Date().toISOString();
    try {
      const response = await CollectionService.updateCollection(id, data);
      if (response.data.created) response.data.created = new Date(response.data.created);
      if (response.data.updated) response.data.updated = new Date(response.data.updated);
      const index = collections.value.findIndex(c => c.id === id);
      if (index !== -1) {
        collections.value[index] = response.data;
        collections.value = [...collections.value];
      }
      return response.data;
    } catch (e) {
      console.error('Failed to update collection:', e);
      throw e;
    }
  };

  /**
   * Deletes a collection record by ID.
   * @param {string} id - The ID of the collection to delete
   * @returns {Promise<void>}
   */
  const deleteCollection = async id => {
    try {
      await CollectionService.deleteCollection(id);
      collections.value = collections.value.filter(c => c.id !== id);
      totalRecords.value--;
    } catch (e) {
      console.error('Failed to delete collection:', e);
      throw e;
    }
  };

  return {
    collections,
    totalRecords,
    loading,
    loadCollections,
    createCollection,
    updateCollection,
    deleteCollection,
  };
});
