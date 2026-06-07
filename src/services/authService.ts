import { apiFetch, fetchJson } from './api';

export const authService = {
  login: async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    return fetchJson('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  checkAuthStatus: async (): Promise<boolean> => {
    try {
      const response = await apiFetch('/api/auth/status');
      return response.ok;
    } catch {
      return false;
    }
  },
};
