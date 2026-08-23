/**
 * Storage Module - Session persistence only.
 *
 * Server-owned data (students, projects, team members) now comes from the
 * real Backend via js/api.js. This module only keeps what belongs on the
 * client: the JWT auth token and a cached copy of the logged-in student's
 * profile (used purely for instant UI display — the backend is always the
 * source of truth and re-validates the token on every request).
 *
 * Every method stays async (even though localStorage is synchronous) so
 * call sites remain `await Storage.x()` regardless of the backing store.
 */
const Storage = {
  KEYS: {
    TOKEN: 'gps_token',
    CURRENT_USER: 'gps_current_user'
  },

  async get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Storage get error:', e);
      return null;
    }
  },

  async set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage set error:', e);
      return false;
    }
  },

  async remove(key) {
    localStorage.removeItem(key);
  },

  // Token
  async setToken(token) {
    return this.set(this.KEYS.TOKEN, token);
  },

  async getToken() {
    return this.get(this.KEYS.TOKEN);
  },

  async clearToken() {
    return this.remove(this.KEYS.TOKEN);
  },

  // Session (token + cached student profile for UI display)
  async setSession(token, student) {
    await this.setToken(token);
    await this.setCurrentUser(student);
  },

  async clearSession() {
    await this.clearToken();
    await this.clearCurrentUser();
  },

  // Cached current user (student profile)
  async setCurrentUser(user) {
    return this.set(this.KEYS.CURRENT_USER, user);
  },

  async getCurrentUser() {
    return this.get(this.KEYS.CURRENT_USER);
  },

  async clearCurrentUser() {
    return this.remove(this.KEYS.CURRENT_USER);
  }
};
