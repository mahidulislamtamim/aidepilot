export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type BodyType = 'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw';
export type AuthType = 'none' | 'bearer';

export interface Workspace {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Folder {
  id: string;
  workspace_id: string;
  parent_id: string | null;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface RequestHeader {
  id: string;
  request_id: string;
  key: string;
  value: string;
  enabled: number;
  sort_order: number;
}

export interface RequestParam {
  id: string;
  request_id: string;
  key: string;
  value: string;
  enabled: number;
  sort_order: number;
}

export interface ApiRequest {
  id: string;
  workspace_id: string;
  folder_id: string | null;
  name: string;
  method: HttpMethod;
  url: string;
  body_type: BodyType;
  body: string;
  auth_type: AuthType;
  auth_token: string;
  timeout: number;
  retry_count: number;
  is_favorite: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
  headers?: RequestHeader[];
  params?: RequestParam[];
}

export interface EnvironmentVariable {
  key: string;
  value: string;
  enabled: boolean;
}

export interface Environment {
  id: string;
  workspace_id: string;
  name: string;
  variables: EnvironmentVariable[];
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface HistoryEntry {
  id: string;
  request_id: string | null;
  workspace_id: string;
  method: string;
  url: string;
  status_code: number | null;
  response_time: number | null;
  request_body: string | null;
  response_body: string | null;
  response_headers: string | null;
  created_at: string;
}

export interface ExecuteRequestPayload {
  method: HttpMethod;
  url: string;
  headers: Array<{ key: string; value: string; enabled: boolean }>;
  params: Array<{ key: string; value: string; enabled: boolean }>;
  body_type: BodyType;
  body: string;
  auth_type: AuthType;
  auth_token: string;
  timeout: number;
  retry_count: number;
  variables?: Record<string, string>;
}

export interface ExecuteResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  responseTime: number;
  size: number;
}
