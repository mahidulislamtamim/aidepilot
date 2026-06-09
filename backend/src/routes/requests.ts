import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { executeRequest } from '../services/proxyService';
import { ApiRequest, ExecuteRequestPayload } from '../types';
import { paramId } from '../utils/params';

const router = Router();

function getFullRequest(db: ReturnType<typeof getDb>, id: string): ApiRequest | undefined {
  const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(id) as unknown as ApiRequest | undefined;
  if (!request) return undefined;

  request.headers = db
    .prepare('SELECT * FROM request_headers WHERE request_id = ? ORDER BY sort_order')
    .all(id) as unknown as ApiRequest['headers'];
  request.params = db
    .prepare('SELECT * FROM request_params WHERE request_id = ? ORDER BY sort_order')
    .all(id) as unknown as ApiRequest['params'];
  return request;
}

function saveHeadersAndParams(
  db: ReturnType<typeof getDb>,
  requestId: string,
  headers: Array<{ key: string; value: string; enabled?: boolean }> = [],
  params: Array<{ key: string; value: string; enabled?: boolean }> = []
) {
  db.prepare('DELETE FROM request_headers WHERE request_id = ?').run(requestId);
  db.prepare('DELETE FROM request_params WHERE request_id = ?').run(requestId);

  headers.forEach((h, i) => {
    if (!h.key) return;
    db.prepare(
      'INSERT INTO request_headers (id, request_id, key, value, enabled, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(uuidv4(), requestId, h.key, h.value ?? '', h.enabled !== false ? 1 : 0, i);
  });

  params.forEach((p, i) => {
    if (!p.key) return;
    db.prepare(
      'INSERT INTO request_params (id, request_id, key, value, enabled, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(uuidv4(), requestId, p.key, p.value ?? '', p.enabled !== false ? 1 : 0, i);
  });
}

router.get('/workspace/:workspaceId', (req: Request, res: Response) => {
  const db = getDb();
  const { search, favorite } = req.query;

  let query = 'SELECT * FROM requests WHERE workspace_id = ?';
  const params: unknown[] = [paramId(req, 'workspaceId')];

  if (search) {
    query += ' AND (name LIKE ? OR url LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term);
  }
  if (favorite === 'true') {
    query += ' AND is_favorite = 1';
  }
  query += ' ORDER BY sort_order, name';

  const requests = db.prepare(query).all(...params) as unknown as ApiRequest[];
  res.json(requests);
});

router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const request = getFullRequest(db, paramId(req));
  if (!request) return res.status(404).json({ error: 'Request not found' });
  res.json(request);
});

router.post('/', (req: Request, res: Response) => {
  const db = getDb();
  const {
    workspace_id,
    folder_id,
    name,
    method = 'GET',
    url = '',
    body_type = 'json',
    body = '',
    auth_type = 'none',
    auth_token = '',
    timeout = 30000,
    retry_count = 0,
    headers = [],
    params = [],
  } = req.body;

  if (!workspace_id || !name?.trim()) {
    return res.status(400).json({ error: 'workspace_id and name are required' });
  }

  const id = uuidv4();
  db.prepare(
    `INSERT INTO requests (id, workspace_id, folder_id, name, method, url, body_type, body, auth_type, auth_token, timeout, retry_count)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    workspace_id,
    folder_id ?? null,
    name.trim(),
    method,
    url,
    body_type,
    body,
    auth_type,
    auth_token,
    timeout,
    retry_count
  );

  saveHeadersAndParams(db, id, headers, params);
  const request = getFullRequest(db, id);
  res.status(201).json(request);
});

router.put('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM requests WHERE id = ?').get(paramId(req));
  if (!existing) return res.status(404).json({ error: 'Request not found' });

  const {
    name,
    folder_id,
    method,
    url,
    body_type,
    body,
    auth_type,
    auth_token,
    timeout,
    retry_count,
    is_favorite,
    headers,
    params,
  } = req.body;

  db.prepare(
    `UPDATE requests SET
      name = COALESCE(?, name),
      folder_id = COALESCE(?, folder_id),
      method = COALESCE(?, method),
      url = COALESCE(?, url),
      body_type = COALESCE(?, body_type),
      body = COALESCE(?, body),
      auth_type = COALESCE(?, auth_type),
      auth_token = COALESCE(?, auth_token),
      timeout = COALESCE(?, timeout),
      retry_count = COALESCE(?, retry_count),
      is_favorite = COALESCE(?, is_favorite),
      updated_at = datetime('now')
    WHERE id = ?`
  ).run(
    name?.trim() ?? null,
    folder_id !== undefined ? folder_id : null,
    method ?? null,
    url ?? null,
    body_type ?? null,
    body ?? null,
    auth_type ?? null,
    auth_token ?? null,
    timeout ?? null,
    retry_count ?? null,
    is_favorite !== undefined ? (is_favorite ? 1 : 0) : null,
    paramId(req)
  );

  if (headers !== undefined || params !== undefined) {
    const current = getFullRequest(db, paramId(req));
    saveHeadersAndParams(db, paramId(req), headers ?? current?.headers, params ?? current?.params);
  }

  const request = getFullRequest(db, paramId(req));
  res.json(request);
});

router.post('/:id/duplicate', (req: Request, res: Response) => {
  const db = getDb();
  const original = getFullRequest(db, paramId(req));
  if (!original) return res.status(404).json({ error: 'Request not found' });

  const id = uuidv4();
  db.prepare(
    `INSERT INTO requests (id, workspace_id, folder_id, name, method, url, body_type, body, auth_type, auth_token, timeout, retry_count)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    original.workspace_id,
    original.folder_id,
    `${original.name} (Copy)`,
    original.method,
    original.url,
    original.body_type,
    original.body,
    original.auth_type,
    original.auth_token,
    original.timeout,
    original.retry_count
  );

  saveHeadersAndParams(
    db,
    id,
    original.headers?.map((h) => ({ key: h.key, value: h.value, enabled: !!h.enabled })),
    original.params?.map((p) => ({ key: p.key, value: p.value, enabled: !!p.enabled }))
  );

  const request = getFullRequest(db, id);
  res.status(201).json(request);
});

router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM requests WHERE id = ?').run(paramId(req));
  if (result.changes === 0) return res.status(404).json({ error: 'Request not found' });
  res.status(204).send();
});

router.post('/execute', async (req: Request, res: Response) => {
  try {
    const payload = req.body as ExecuteRequestPayload;
    if (!payload.url) return res.status(400).json({ error: 'URL is required' });

    const result = await executeRequest(payload);

    if (req.body.save_history && req.body.workspace_id) {
      const db = getDb();
      db.prepare(
        `INSERT INTO history (id, request_id, workspace_id, method, url, status_code, response_time, request_body, response_body, response_headers)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        uuidv4(),
        req.body.request_id ?? null,
        req.body.workspace_id,
        payload.method,
        payload.url,
        result.status,
        result.responseTime,
        payload.body ?? null,
        result.body,
        JSON.stringify(result.headers)
      );
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
