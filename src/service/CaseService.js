import ApiService from '@/api/ApiService';

/**
 * Service for interacting with the /cases API endpoints.
 * Includes helper logic for mapping PrimeVue event states to query parameters.
 */
class CaseService {
  /**
   * Helper to map PrimeVue TreeTable/DataTable events to json-server query parameters.
   * Handles pagination, sorting, and global search.
   * @param {Object} event - The PrimeVue table event object
   * @returns {Object} A parameters object for the API request
   * @private
   */
  _mapEventToParams(event) {
    let params = {};

    // Pagination
    if (event.rows) {
      params._per_page = event.rows;
      params._page = event.first / event.rows + 1;
    }

    // Sorting
    if (event.sortField) {
      params._sort = event.sortOrder === -1 ? `-${event.sortField}` : event.sortField;
    } else {
      // Default to returning newest created items at the top
      params._sort = '-created';
    }

    // Searching / Filtering
    if (event.filters) {
      // Global Search over key fields
      if (event.filters.global) {
        params.q = event.filters.global; // 'q' is json-server's full-text search
      }

      // If we implement specific column filters later we can add them here:
      // if (event.filters.created) { params.created_like = filterData; }
    }

    return params;
  }

  /**
   * Fetches cases with optional filtering, sorting, and pagination.
   * @param {Object} [event={}] - Optional table event for filtering/sorting/pagination
   * @returns {Promise<{data: Array, totalCount?: number}>} List of cases
   */
  async getCases(event = {}) {
    const params = this._mapEventToParams(event);
    return await ApiService.get('/cases', params);
  }

  /**
   * Creates a new case record.
   * @param {Object} caseData - The case metadata to create
   * @returns {Promise<{data: Object}>} The created case object
   */
  async createCase(caseData) {
    return await ApiService.post('/cases', caseData);
  }

  /**
   * Updates an existing case record.
   * @param {string} id - The unique ID of the case
   * @param {Object} caseData - The metadata to update
   * @returns {Promise<{data: Object}>} The updated case object
   */
  async updateCase(id, caseData) {
    return await ApiService.patch(`/cases/${id}`, caseData);
  }

  /**
   * Deletes a case record.
   * @param {string} id - The unique ID of the case to delete
   * @returns {Promise<void>}
   */
  async deleteCase(id) {
    return await ApiService.delete(`/cases/${id}`);
  }
}

export default new CaseService();
