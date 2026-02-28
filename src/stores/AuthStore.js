import AuthService from '@/service/AuthService';
import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * @typedef {Object} UserRecord
 * @property {string} id - Unique ID of the user
 * @property {string} email - User's email
 * @property {string} name - User's name
 * @property {string} role - User's role for conditional rendering
 */

/**
 * Store for managing authentication state and actions.
 * Coordinates with AuthService to authenticate users.
 */
export const useAuthStore = defineStore('auth', () => {
  /** @type {import('vue').Ref<boolean>} State indicating if the user is authenticated */
  const isAuthenticated = ref(false);

  /** @type {import('vue').Ref<UserRecord|null>} Current authenticated user data */
  const user = ref(null);

  /** @type {import('vue').Ref<boolean>} Loading state for auth-related operations */
  const loading = ref(false);

  /** @type {import('vue').Ref<string|null>} Authentication error message */
  const error = ref(null);

  /**
   * Logs in a user.
   * @param {string} email - The user's email address
   * @param {string} password - The user's password
   * @returns {Promise<UserRecord>} The logged-in user record
   */
  const login = async (email, password) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await AuthService.login(email, password);
      // Determine user object based on standard API formats
      user.value = response?.data?.user || response?.data || response || {};
      isAuthenticated.value = true;
      return user.value;
    } catch (e) {
      console.error('Login failed:', e);
      error.value = e.response?.data?.message || e.message || 'Login failed';
      throw e;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Logs out the current user.
   * @returns {Promise<void>}
   */
  const logout = async () => {
    loading.value = true;
    try {
      await AuthService.logout();
    } catch (e) {
      console.error('Logout failed:', e);
      // We might still want to clear local state even if server logout fails
    } finally {
      user.value = null;
      isAuthenticated.value = false;
      loading.value = false;
    }
  };

  return {
    isAuthenticated,
    user,
    loading,
    error,
    login,
    logout,
  };
});
