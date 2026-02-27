const BASE_URL = 'http://localhost:3000'; // JSON Server

/**
 * Centered API class for handling all fetch-based network requests.
 * Standardizes headers, body serialization, and response parsing.
 */
class ApiService {
  /**
   * Core request method that wraps the fetch API.
   * @param {string} endpoint - The API endpoint relative to the BASE_URL
   * @param {RequestInit} [options={}] - Standard fetch options
   * @returns {Promise<{data: any}>} The parsed response data
   * @throws {Error} If the response is not OK or parsing fails
   */
  async request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const config = {
      ...options,
      headers,
    };

    if (config.body && typeof config.body !== 'string') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);

      // Parse JSON if possible. Handles 204 No Content gracefully.
      const contentType = response.headers.get('content-type');
      let data = null;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else if (response.status !== 204) {
        data = await response.text();
      }

      if (!response.ok) {
        throw new Error(data?.message || data || `Request failed with status ${response.status}`);
      }

      // Extract the nested data array if json-server wraps it, just in case
      if (data && typeof data === 'object' && !Array.isArray(data) && Array.isArray(data.data)) {
        data = data.data;
      }

      return {
        data,
      };
    } catch (error) {
      console.error(`API Request Error (${endpoint}):`, error);
      throw error;
    }
  }

  /**
   * Performs a GET request.
   * @param {string} endpoint - The endpoint to target
   * @param {Object} [params={}] - Query parameters to append to the URL
   * @returns {Promise<{data: any}>}
   */
  get(endpoint, params = {}) {
    // Convert params object to query string
    const query = new URLSearchParams(params).toString();
    const fullEndpoint = query ? `${endpoint}?${query}` : endpoint;
    return this.request(fullEndpoint, { method: 'GET' });
  }

  /**
   * Performs a POST request.
   * @param {string} endpoint - The endpoint to target
   * @param {Object} body - the JSON payload
   * @returns {Promise<{data: any}>}
   */
  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body });
  }

  /**
   * Performs a PUT request (full replacement).
   * @param {string} endpoint - The endpoint to target
   * @param {Object} body - the JSON payload
   * @returns {Promise<{data: any}>}
   */
  put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body });
  }

  /**
   * Performs a PATCH request (partial update).
   * @param {string} endpoint - The endpoint to target
   * @param {Object} body - the JSON payload
   * @returns {Promise<{data: any}>}
   */
  patch(endpoint, body) {
    return this.request(endpoint, { method: 'PATCH', body });
  }

  /**
   * Performs a DELETE request.
   * @param {string} endpoint - The endpoint to target
   * @returns {Promise<{data: any}>}
   */
  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export default new ApiService();
