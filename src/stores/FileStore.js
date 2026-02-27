import FileService from '@/service/FileService';
import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * @typedef {Object} FileRecord
 * @property {string} id - Unique ID of the file
 * @property {string} name - Name of the file
 * @property {string} collectionId - ID of the collection this file belongs to
 * @property {Date|null} uploaded - Date when the file was uploaded
 * @property {string} type - File type (e.g., 'File')
 * @property {number} size - File size in bytes
 */

/**
 * Store for managing file metadata and CRUD operations.
 * Coordinates with FileService to persist changes to the backend.
 */
export const useFileStore = defineStore('file', () => {
  /** @type {import('vue').Ref<FileRecord[]>} List of files in the currently active collection */
  const files = ref([]);

  /** @type {import('vue').Ref<number>} Total number of records available for the collection */
  const totalRecords = ref(0);

  /** @type {import('vue').Ref<boolean>} Loading state for file operations */
  const loading = ref(false);

  /**
   * Loads files for a specific collection.
   * @param {string} collectionId - The ID of the collection to fetch files for
   * @returns {Promise<void>}
   */
  const loadFiles = async collectionId => {
    loading.value = true;
    try {
      const response = await FileService.getFilesByCollection(collectionId);
      files.value = response.data.map(item => ({
        ...item,
        uploaded: item.uploaded ? new Date(item.uploaded) : null,
      }));
      totalRecords.value = response.totalCount || response.data.length;
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      loading.value = false;
    }
  };

  /**
   * Creates a new file record in a collection.
   * @param {string} collectionId - The ID of the collection to add the file to
   * @param {Partial<FileRecord>} data - The file data to create
   * @returns {Promise<FileRecord>} The created file record
   */
  const createFile = async (collectionId, data) => {
    data.uploaded = new Date().toISOString();
    data.collectionId = collectionId;
    data.type = 'File';
    data.size = data.size || 1048576; // Default size if not provided
    try {
      const response = await FileService.createFile(data);
      if (response.data.uploaded) response.data.uploaded = new Date(response.data.uploaded);
      files.value = [response.data, ...files.value];
      totalRecords.value++;
      return response.data;
    } catch (e) {
      console.error('Failed to create file:', e);
      throw e;
    }
  };

  /**
   * Updates an existing file record.
   * @param {string} id - The ID of the file to update
   * @param {Object} data - The patch data to apply
   * @returns {Promise<FileRecord>} The updated file record
   */
  const updateFile = async (id, data) => {
    try {
      const response = await FileService.updateFile(id, data);
      if (response.data.uploaded) response.data.uploaded = new Date(response.data.uploaded);
      const index = files.value.findIndex(f => f.id === id);
      if (index !== -1) {
        files.value[index] = response.data;
        files.value = [...files.value];
      }
      return response.data;
    } catch (e) {
      console.error('Failed to update file:', e);
      throw e;
    }
  };

  /**
   * Deletes a file record by ID.
   * @param {string} id - The ID of the file to delete
   * @returns {Promise<void>}
   */
  const deleteFile = async id => {
    try {
      await FileService.deleteFile(id);
      files.value = files.value.filter(f => f.id !== id);
      totalRecords.value--;
    } catch (e) {
      console.error('Failed to delete file:', e);
      throw e;
    }
  };

  return {
    files,
    totalRecords,
    loading,
    loadFiles,
    createFile,
    updateFile,
    deleteFile,
  };
});
