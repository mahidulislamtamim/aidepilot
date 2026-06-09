import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import FormData from 'form-data';
import { BodyType, ExecuteRequestPayload, ExecuteResponse } from '../types';

function interpolateVariables(text: string, variables: Record<string, string> = {}): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables[key] ?? `{{${key}}}`);
}

function buildUrl(
  url: string,
  params: ExecuteRequestPayload['params'],
  variables: Record<string, string>
): string {
  const interpolatedUrl = interpolateVariables(url, variables);
  const enabledParams = params.filter((p) => p.enabled && p.key.trim());
  if (enabledParams.length === 0) return interpolatedUrl;

  const urlObj = new URL(interpolatedUrl.includes('://') ? interpolatedUrl : `https://${interpolatedUrl}`);
  enabledParams.forEach((p) => {
    urlObj.searchParams.set(p.key, interpolateVariables(p.value, variables));
  });
  return urlObj.toString();
}

function buildHeaders(
  headers: ExecuteRequestPayload['headers'],
  authType: string,
  authToken: string,
  variables: Record<string, string>
): Record<string, string> {
  const result: Record<string, string> = {};
  headers
    .filter((h) => h.enabled && h.key.trim())
    .forEach((h) => {
      result[h.key] = interpolateVariables(h.value, variables);
    });

  if (authType === 'bearer' && authToken) {
    result['Authorization'] = `Bearer ${interpolateVariables(authToken, variables)}`;
  }
  return result;
}

function buildBody(
  bodyType: BodyType,
  body: string,
  variables: Record<string, string>
): { data: unknown; headers: Record<string, string> } {
  const interpolated = interpolateVariables(body, variables);
  const extraHeaders: Record<string, string> = {};

  switch (bodyType) {
    case 'json':
      extraHeaders['Content-Type'] = 'application/json';
      try {
        return { data: interpolated ? JSON.parse(interpolated) : undefined, headers: extraHeaders };
      } catch {
        return { data: interpolated, headers: extraHeaders };
      }
    case 'x-www-form-urlencoded': {
      extraHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
      const params = new URLSearchParams();
      try {
        const parsed = JSON.parse(interpolated || '[]') as Array<{ key: string; value: string; enabled?: boolean }>;
        parsed
          .filter((f) => f.enabled !== false && f.key)
          .forEach((f) => params.append(f.key, interpolateVariables(f.value, variables)));
      } catch {
        /* use raw string */
      }
      return { data: params.toString(), headers: extraHeaders };
    }
    case 'form-data': {
      const form = new FormData();
      try {
        const parsed = JSON.parse(interpolated || '[]') as Array<{
          key: string;
          value: string;
          enabled?: boolean;
        }>;
        parsed
          .filter((f) => f.enabled !== false && f.key)
          .forEach((f) => form.append(f.key, interpolateVariables(f.value, variables)));
      } catch {
        /* empty form */
      }
      return { data: form, headers: form.getHeaders() as Record<string, string> };
    }
    case 'raw':
    default:
      return { data: interpolated || undefined, headers: extraHeaders };
  }
}

async function executeOnce(config: AxiosRequestConfig): Promise<ExecuteResponse> {
  const start = Date.now();
  const response = await axios(config);
  const responseTime = Date.now() - start;

  let body: string;
  if (typeof response.data === 'object') {
    body = JSON.stringify(response.data, null, 2);
  } else {
    body = String(response.data ?? '');
  }

  const headers: Record<string, string> = {};
  Object.entries(response.headers).forEach(([k, v]) => {
    headers[k] = String(v);
  });

  return {
    status: response.status,
    statusText: response.statusText,
    headers,
    body,
    responseTime,
    size: Buffer.byteLength(body, 'utf-8'),
  };
}

export async function executeRequest(payload: ExecuteRequestPayload): Promise<ExecuteResponse> {
  const variables = payload.variables ?? {};
  const url = buildUrl(payload.url, payload.params, variables);
  const headers = buildHeaders(payload.headers, payload.auth_type, payload.auth_token, variables);
  const { data, headers: bodyHeaders } = buildBody(payload.body_type, payload.body, variables);

  const config: AxiosRequestConfig = {
    method: payload.method,
    url,
    headers: { ...headers, ...bodyHeaders },
    data: ['GET', 'HEAD'].includes(payload.method) ? undefined : data,
    timeout: payload.timeout || 30000,
    validateStatus: () => true,
    maxRedirects: 5,
  };

  const maxRetries = payload.retry_count || 0;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await executeOnce(config);
    } catch (err) {
      lastError = err as Error;
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  const axiosErr = lastError as AxiosError;
  const start = Date.now();
  return {
    status: axiosErr?.response?.status ?? 0,
    statusText: axiosErr?.message ?? 'Request Failed',
    headers: (axiosErr?.response?.headers as Record<string, string>) ?? {},
    body: JSON.stringify(
      { error: axiosErr?.message, code: (axiosErr as NodeJS.ErrnoException)?.code },
      null,
      2
    ),
    responseTime: Date.now() - start,
    size: 0,
  };
}
