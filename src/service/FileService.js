import ApiService from '@/api/ApiService';

/**
 * Service for interacting with the /files API endpoints.
 */
class FileService {
  /**
   * Fetches files associated with a specific collection.
   * @param {string} collectionId - The ID of the collection to fetch files for
   * @returns {Promise<{data: Array}>} List of file objects
   */
  async getFilesByCollection(collectionId) {
    if (!collectionId) return { data: [] };

    // JSON-Server coercively parses numeric strings in the route query (e.g. ?collectionId=1276) into Integers.
    if (/^\d+$/.test(collectionId)) {
      const response = await ApiService.get('/files');
      const allFiles = Array.isArray(response.data) ? response.data : [];
      return { data: allFiles.filter(val => val.collectionId === String(collectionId)) };
    }

    return await ApiService.get('/files', { collectionId: String(collectionId) });
  }

  /**
   * Creates a new file record on the server.
   * @param {Object} fileData - The file metadata to create
   * @returns {Promise<{data: Object}>} The created file object
   */
  async createFile(fileData) {
    return await ApiService.post('/files', fileData);
  }

  /**
   * Updates an existing file record.
   * @param {string} id - The unique ID of the file
   * @param {Object} fileData - The metadata to update
   * @returns {Promise<{data: Object}>} The updated file object
   */
  async updateFile(id, fileData) {
    return await ApiService.patch(`/files/${id}`, fileData);
  }

  /**
   * Deletes a file record from the server.
   * @param {string} id - The unique ID of the file to delete
   * @returns {Promise<void>}
   */
  async deleteFile(id) {
    return await ApiService.delete(`/files/${id}`);
  }
}

export default new FileService();
