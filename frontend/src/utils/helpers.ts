import type { ApiRequest, HttpMethod, RequestEditorState } from '@/types';
import { DEFAULT_REQUEST_STATE } from '@/types';

export function getMethodColor(method: HttpMethod | string): string {
  const colors: Record<string, string> = {
    GET: 'text-method-get',
    POST: 'text-method-post',
    PUT: 'text-method-put',
    PATCH: 'text-method-patch',
    DELETE: 'text-method-delete',
  };
  return colors[method.toUpperCase()] ?? 'text-gray-400';
}

export function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) return 'text-green-400';
  if (status >= 300 && status < 400) return 'text-blue-400';
  if (status >= 400 && status < 500) return 'text-amber-400';
  if (status >= 500) return 'text-red-400';
  return 'text-gray-400';
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function requestToEditorState(request: ApiRequest): RequestEditorState {
  return {
    name: request.name,
    method: request.method,
    url: request.url,
    body_type: request.body_type,
    body: request.body || (request.body_type === 'json' ? '{\n  \n}' : ''),
    auth_type: request.auth_type,
    auth_token: request.auth_token,
    timeout: request.timeout,
    retry_count: request.retry_count,
    headers:
      request.headers && request.headers.length > 0
        ? request.headers.map((h) => ({ key: h.key, value: h.value, enabled: !!h.enabled }))
        : [{ key: '', value: '', enabled: true }],
    params:
      request.params && request.params.length > 0
        ? request.params.map((p) => ({ key: p.key, value: p.value, enabled: !!p.enabled }))
        : [{ key: '', value: '', enabled: true }],
    folder_id: request.folder_id,
    is_favorite: !!request.is_favorite,
  };
}

export function editorStateToApiPayload(state: RequestEditorState) {
  return {
    name: state.name,
    method: state.method,
    url: state.url,
    body_type: state.body_type,
    body: state.body,
    auth_type: state.auth_type,
    auth_token: state.auth_token,
    timeout: state.timeout,
    retry_count: state.retry_count,
    folder_id: state.folder_id,
    is_favorite: state.is_favorite ? 1 : 0,
    headers: state.headers.filter((h) => h.key),
    params: state.params.filter((p) => p.key),
  };
}

export function createNewTabState(name = 'Untitled Request'): RequestEditorState {
  return { ...DEFAULT_REQUEST_STATE, name };
}

export function tryFormatJson(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

export function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
