import type { RequestEditorState } from '@/types';

function getEnabledHeaders(state: RequestEditorState): Record<string, string> {
  const headers: Record<string, string> = {};
  state.headers.filter((h) => h.enabled && h.key).forEach((h) => {
    headers[h.key] = h.value;
  });
  if (state.auth_type === 'bearer' && state.auth_token) {
    headers['Authorization'] = `Bearer ${state.auth_token}`;
  }
  return headers;
}

function buildUrl(state: RequestEditorState): string {
  const enabledParams = state.params.filter((p) => p.enabled && p.key);
  if (enabledParams.length === 0) return state.url;
  const url = new URL(state.url.includes('://') ? state.url : `https://${state.url}`);
  enabledParams.forEach((p) => url.searchParams.set(p.key, p.value));
  return url.toString();
}

export function generateCurl(state: RequestEditorState): string {
  const url = buildUrl(state);
  const headers = getEnabledHeaders(state);
  const parts = [`curl -X ${state.method} '${url}'`];

  Object.entries(headers).forEach(([k, v]) => {
    parts.push(`  -H '${k}: ${v}'`);
  });

  if (!['GET', 'DELETE'].includes(state.method) && state.body) {
    if (state.body_type === 'json') {
      parts.push(`  -d '${state.body.replace(/'/g, "'\\''")}'`);
    } else {
      parts.push(`  -d '${state.body.replace(/'/g, "'\\''")}'`);
    }
  }

  return parts.join(' \\\n');
}

export function generateFetch(state: RequestEditorState): string {
  const url = buildUrl(state);
  const headers = getEnabledHeaders(state);
  const hasBody = !['GET', 'DELETE'].includes(state.method) && state.body;

  let bodyLine = '';
  if (hasBody) {
    if (state.body_type === 'json') {
      bodyLine = `,\n  body: JSON.stringify(${state.body})`;
    } else {
      bodyLine = `,\n  body: ${JSON.stringify(state.body)}`;
    }
  }

  return `const response = await fetch('${url}', {
  method: '${state.method}',
  headers: ${JSON.stringify(headers, null, 2).replace(/\n/g, '\n  ')}${bodyLine}
});

const data = await response.json();
console.log(data);`;
}

export function generateAxios(state: RequestEditorState): string {
  const url = buildUrl(state);
  const headers = getEnabledHeaders(state);
  const hasBody = !['GET', 'DELETE'].includes(state.method) && state.body;

  let dataLine = '';
  if (hasBody) {
    if (state.body_type === 'json') {
      dataLine = `,\n  data: ${state.body}`;
    } else {
      dataLine = `,\n  data: ${JSON.stringify(state.body)}`;
    }
  }

  return `import axios from 'axios';

const response = await axios({
  method: '${state.method.toLowerCase()}',
  url: '${url}',
  headers: ${JSON.stringify(headers, null, 2).replace(/\n/g, '\n  ')}${dataLine}
});

console.log(response.data);`;
}
