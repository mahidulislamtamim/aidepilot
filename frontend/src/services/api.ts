import axios from 'axios';
import type {
  ApiRequest,
  Environment,
  ExecuteResponse,
  Folder,
  HistoryEntry,
  RequestEditorState,
  Workspace,
} from '@/types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export const workspaceApi = {
  getAll: () => api.get<Workspace[]>('/workspaces').then((r) => r.data),
  get: (id: string) => api.get<Workspace>(`/workspaces/${id}`).then((r) => r.data),
  create: (name: string, description = '') =>
    api.post<Workspace>('/workspaces', { name, description }).then((r) => r.data),
  update: (id: string, data: Partial<Workspace>) =>
    api.put<Workspace>(`/workspaces/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/workspaces/${id}`),
  export: (id: string) => api.get(`/workspaces/${id}/export`).then((r) => r.data),
  import: (data: unknown) => api.post<Workspace>('/workspaces/import', data).then((r) => r.data),
};

export const folderApi = {
  getByWorkspace: (workspaceId: string) =>
    api.get<Folder[]>(`/folders/workspace/${workspaceId}`).then((r) => r.data),
  create: (workspace_id: string, name: string, parent_id?: string | null) =>
    api.post<Folder>('/folders', { workspace_id, name, parent_id }).then((r) => r.data),
  update: (id: string, data: Partial<Folder>) =>
    api.put<Folder>(`/folders/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/folders/${id}`),
};

export const requestApi = {
  getByWorkspace: (workspaceId: string, search?: string, favorite?: boolean) =>
    api
      .get<ApiRequest[]>(`/requests/workspace/${workspaceId}`, {
        params: { search, favorite: favorite ? 'true' : undefined },
      })
      .then((r) => r.data),
  get: (id: string) => api.get<ApiRequest>(`/requests/${id}`).then((r) => r.data),
  create: (data: Partial<ApiRequest> & { workspace_id: string; name: string }) =>
    api.post<ApiRequest>('/requests', data).then((r) => r.data),
  update: (id: string, data: Partial<ApiRequest>) =>
    api.put<ApiRequest>(`/requests/${id}`, data).then((r) => r.data),
  duplicate: (id: string) => api.post<ApiRequest>(`/requests/${id}/duplicate`).then((r) => r.data),
  delete: (id: string) => api.delete(`/requests/${id}`),
  execute: (
    data: RequestEditorState & {
      workspace_id?: string;
      request_id?: string;
      save_history?: boolean;
      variables?: Record<string, string>;
    }
  ) => api.post<ExecuteResponse>('/requests/execute', data).then((r) => r.data),
};

export const environmentApi = {
  getByWorkspace: (workspaceId: string) =>
    api.get<Environment[]>(`/environments/workspace/${workspaceId}`).then((r) => r.data),
  create: (workspace_id: string, name: string, variables = []) =>
    api.post<Environment>('/environments', { workspace_id, name, variables }).then((r) => r.data),
  update: (id: string, data: Partial<Environment>) =>
    api.put<Environment>(`/environments/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/environments/${id}`),
};

export const historyApi = {
  getByWorkspace: (workspaceId: string, limit = 50) =>
    api.get<HistoryEntry[]>(`/history/workspace/${workspaceId}`, { params: { limit } }).then((r) => r.data),
  clear: (workspaceId: string) => api.delete(`/history/workspace/${workspaceId}`),
};

export default api;
