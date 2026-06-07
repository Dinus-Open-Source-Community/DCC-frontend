import { fetchJson } from './api';

export interface AuditLog {
  id: number;
  event_type: string;
  client_id: string | null;
  username: string | null;
  details: string;
  ip_address: string | null;
  created_at: string;
}

export const logService = {
  getLogs: async (): Promise<AuditLog[]> => {
    return fetchJson<AuditLog[]>('/api/logs');
  },

  clearLogs: async (): Promise<{ success: boolean; message: string }> => {
    return fetchJson<{ success: boolean; message: string }>('/api/logs/clear', {
      method: 'POST',
    });
  },
};
