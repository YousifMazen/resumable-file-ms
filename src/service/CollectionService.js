import ApiService from '@/api/ApiService';

/**
 * Service for interacting with the /collections API endpoints.
 */
class CollectionService {
  /**
   * Fetches collections associated with a specific case.
   * @param {string} caseId - The ID of the case to fetch collections for
   * @returns {Promise<{data: Array}>} List of collection objects
   */
  async getCollectionsByCase(caseId) {
    return await ApiService.get(`/collections`, { caseId });
  }

  /**
   * Creates a new collection record.
   * @param {Object} collectionData - The collection metadata to create
   * @returns {Promise<{data: Object}>} The created collection object
   */
  async createCollection(collectionData) {
    return await ApiService.post('/collections', collectionData);
  }

  /**
   * Updates an existing collection record.
   * @param {string} id - The unique ID of the collection
   * @param {Object} collectionData - The metadata to update
   * @returns {Promise<{data: Object}>} The updated collection object
   */
  async updateCollection(id, collectionData) {
    return await ApiService.patch(`/collections/${id}`, collectionData);
  }

  /**
   * Deletes a collection record.
   * @param {string} id - The unique ID of the collection to delete
   * @returns {Promise<void>}
   */
  async deleteCollection(id) {
    return await ApiService.delete(`/collections/${id}`);
  }
}

export default new CollectionService();
