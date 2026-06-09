import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { Workspace } from '../types';
import { paramId } from '../utils/params';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const db = getDb();
  const workspaces = db.prepare('SELECT * FROM workspaces ORDER BY updated_at DESC').all() as unknown as Workspace[];
  res.json(workspaces);
});

router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const workspace = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(paramId(req)) as unknown as Workspace | undefined;
  if (!workspace) return res.status(404).json({ error: 'Workspace not found' });
  res.json(workspace);
});

router.post('/', (req: Request, res: Response) => {
  const db = getDb();
  const id = uuidv4();
  const { name, description = '' } = req.body;

  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });

  db.prepare('INSERT INTO workspaces (id, name, description) VALUES (?, ?, ?)').run(
    id,
    name.trim(),
    description
  );

  const workspace = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(id) as unknown as Workspace;
  res.status(201).json(workspace);
});

router.put('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const { name, description } = req.body;
  const existing = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(paramId(req));
  if (!existing) return res.status(404).json({ error: 'Workspace not found' });

  db.prepare(
    `UPDATE workspaces SET name = COALESCE(?, name), description = COALESCE(?, description), updated_at = datetime('now') WHERE id = ?`
  ).run(name?.trim() ?? null, description ?? null, paramId(req));

  const workspace = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(paramId(req)) as unknown as Workspace;
  res.json(workspace);
});

router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM workspaces WHERE id = ?').run(paramId(req));
  if (result.changes === 0) return res.status(404).json({ error: 'Workspace not found' });
  res.status(204).send();
});

router.get('/:id/export', (req: Request, res: Response) => {
  const db = getDb();
  const workspace = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(paramId(req));
  if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

  const folders = db.prepare('SELECT * FROM folders WHERE workspace_id = ?').all(paramId(req));
  const requests = db
    .prepare('SELECT * FROM requests WHERE workspace_id = ?')
    .all(paramId(req)) as Array<{ id: string }>;

  const fullRequests = requests.map((r) => {
    const headers = db.prepare('SELECT * FROM request_headers WHERE request_id = ? ORDER BY sort_order').all(r.id);
    const params = db.prepare('SELECT * FROM request_params WHERE request_id = ? ORDER BY sort_order').all(r.id);
    return { ...r, headers, params };
  });

  const environments = db.prepare('SELECT * FROM environments WHERE workspace_id = ?').all(paramId(req));

  res.json({
    version: '1.0',
    exported_at: new Date().toISOString(),
    workspace,
    folders,
    requests: fullRequests,
    environments,
  });
});

router.post('/import', (req: Request, res: Response) => {
  const db = getDb();
  const { workspace, folders = [], requests = [], environments = [] } = req.body;

  if (!workspace?.name) return res.status(400).json({ error: 'Invalid collection format' });

  const wsId = uuidv4();
  db.prepare('INSERT INTO workspaces (id, name, description) VALUES (?, ?, ?)').run(
    wsId,
    workspace.name,
    workspace.description ?? ''
  );

  const folderIdMap: Record<string, string> = {};
  for (const folder of folders) {
    const newId = uuidv4();
    folderIdMap[folder.id] = newId;
    db.prepare('INSERT INTO folders (id, workspace_id, parent_id, name, sort_order) VALUES (?, ?, ?, ?, ?)').run(
      newId,
      wsId,
      folder.parent_id ? folderIdMap[folder.parent_id] ?? null : null,
      folder.name,
      folder.sort_order ?? 0
    );
  }

  for (const request of requests) {
    const reqId = uuidv4();
    db.prepare(
      `INSERT INTO requests (id, workspace_id, folder_id, name, method, url, body_type, body, auth_type, auth_token, timeout, retry_count, is_favorite, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      reqId,
      wsId,
      request.folder_id ? folderIdMap[request.folder_id] ?? null : null,
      request.name,
      request.method ?? 'GET',
      request.url ?? '',
      request.body_type ?? 'json',
      request.body ?? '',
      request.auth_type ?? 'none',
      request.auth_token ?? '',
      request.timeout ?? 30000,
      request.retry_count ?? 0,
      request.is_favorite ?? 0,
      request.sort_order ?? 0
    );

    for (const h of request.headers ?? []) {
      db.prepare(
        'INSERT INTO request_headers (id, request_id, key, value, enabled, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(uuidv4(), reqId, h.key, h.value ?? '', h.enabled ?? 1, h.sort_order ?? 0);
    }

    for (const p of request.params ?? []) {
      db.prepare(
        'INSERT INTO request_params (id, request_id, key, value, enabled, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(uuidv4(), reqId, p.key, p.value ?? '', p.enabled ?? 1, p.sort_order ?? 0);
    }
  }

  for (const env of environments) {
    db.prepare('INSERT INTO environments (id, workspace_id, name, variables, is_active) VALUES (?, ?, ?, ?, ?)').run(
      uuidv4(),
      wsId,
      env.name,
      typeof env.variables === 'string' ? env.variables : JSON.stringify(env.variables ?? []),
      0
    );
  }

  const created = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(wsId);
  res.status(201).json(created);
});

export default router;
