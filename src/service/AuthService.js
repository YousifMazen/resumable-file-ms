import ApiService from '@/api/ApiService';

/**
 * Service for handling authentication API calls.
 */
class AuthService {
  /**
   * Logs a user in with their email and password.
   * @param {string} email - The user's email address
   * @param {string} password - The user's password
   * @returns {Promise<Object>} The response containing user data and token
   */
  async login(email, password) {
    // Using json-server mock API we fetch the user by email and password
    const response = await ApiService.get('/users', { email, password });

    // If the json-server returned a matching record in the array
    if (response.data && response.data.length > 0) {
      return { data: { user: response.data[0] } };
    }

    throw new Error('Invalid email or password');
  }

  /**
   * Logs out the current user.
   * @returns {Promise<Object>} The response from the server
   */
  async logout() {
    // json-server has no real sessions, mock the logout process entirely
    return Promise.resolve();
  }
}

export default new AuthService();
