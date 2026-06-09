export type ResponseBodyFormat = 'preview' | 'json' | 'xml' | 'raw' | 'text';

export function getContentType(headers: Record<string, string>): string {
  const entry = Object.entries(headers).find(([k]) => k.toLowerCase() === 'content-type');
  return (entry?.[1] ?? '').split(';')[0].trim().toLowerCase();
}

export function looksLikeJson(body: string): boolean {
  const t = body.trim();
  return (t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'));
}

export function looksLikeXml(body: string): boolean {
  const t = body.trim();
  return t.startsWith('<?xml') || (t.startsWith('<') && t.includes('>') && !looksLikeHtml(body));
}

export function looksLikeHtml(body: string): boolean {
  const t = body.trim().toLowerCase();
  return (
    t.startsWith('<!doctype html') ||
    t.startsWith('<html') ||
    /^<(div|p|span|body|head|table|form|section|article|header|footer|main|nav|h[1-6])\b/i.test(t)
  );
}

export function isHtmlResponse(contentType: string, body: string): boolean {
  return contentType.includes('html') || looksLikeHtml(body);
}

export function detectDefaultFormat(contentType: string, body: string): ResponseBodyFormat {
  if (isHtmlResponse(contentType, body)) return 'preview';
  if (contentType.includes('json') || looksLikeJson(body)) return 'json';
  if (contentType.includes('xml') || looksLikeXml(body)) return 'xml';
  if (contentType.includes('text/plain')) return 'text';
  return 'raw';
}

export function tryFormatJson(body: string): string {
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
}

export function tryFormatXml(body: string): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(body, 'application/xml');
    if (doc.querySelector('parsererror')) return body;
    const serialized = new XMLSerializer().serializeToString(doc);
    return formatXmlIndent(serialized);
  } catch {
    return body;
  }
}

function formatXmlIndent(xml: string): string {
  const lines = xml.replace(/>\s*</g, '>\n<').split('\n');
  let indent = 0;
  return lines
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('</')) indent = Math.max(0, indent - 1);
      const padded = '  '.repeat(indent) + trimmed;
      if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>') && !trimmed.includes('</')) {
        indent++;
      }
      return padded;
    })
    .filter(Boolean)
    .join('\n');
}

export const BODY_FORMAT_LABELS: Record<ResponseBodyFormat, string> = {
  preview: 'Preview',
  json: 'JSON',
  xml: 'XML',
  raw: 'Raw',
  text: 'Text',
};
