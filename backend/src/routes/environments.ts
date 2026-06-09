import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { Environment, EnvironmentVariable } from '../types';
import { paramId } from '../utils/params';

const router = Router();

function parseEnvironment(row: Record<string, unknown>): Environment {
  return {
    ...row,
    variables: JSON.parse((row.variables as string) || '[]') as EnvironmentVariable[],
  } as Environment;
}

router.get('/workspace/:workspaceId', (req: Request, res: Response) => {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM environments WHERE workspace_id = ? ORDER BY name')
    .all(paramId(req, 'workspaceId')) as Array<Record<string, unknown>>;
  res.json(rows.map(parseEnvironment));
});

router.post('/', (req: Request, res: Response) => {
  const db = getDb();
  const { workspace_id, name, variables = [] } = req.body;

  if (!workspace_id || !name?.trim()) {
    return res.status(400).json({ error: 'workspace_id and name are required' });
  }

  const id = uuidv4();
  db.prepare('INSERT INTO environments (id, workspace_id, name, variables) VALUES (?, ?, ?, ?)').run(
    id,
    workspace_id,
    name.trim(),
    JSON.stringify(variables)
  );

  const row = db.prepare('SELECT * FROM environments WHERE id = ?').get(id) as Record<string, unknown>;
  res.status(201).json(parseEnvironment(row));
});

router.put('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM environments WHERE id = ?').get(paramId(req));
  if (!existing) return res.status(404).json({ error: 'Environment not found' });

  const { name, variables, is_active } = req.body;

  if (is_active) {
    const env = existing as { workspace_id: string };
    db.prepare('UPDATE environments SET is_active = 0 WHERE workspace_id = ?').run(env.workspace_id);
  }

  db.prepare(
    `UPDATE environments SET
      name = COALESCE(?, name),
      variables = COALESCE(?, variables),
      is_active = COALESCE(?, is_active),
      updated_at = datetime('now')
    WHERE id = ?`
  ).run(
    name?.trim() ?? null,
    variables ? JSON.stringify(variables) : null,
    is_active !== undefined ? (is_active ? 1 : 0) : null,
    paramId(req)
  );

  const row = db.prepare('SELECT * FROM environments WHERE id = ?').get(paramId(req)) as Record<string, unknown>;
  res.json(parseEnvironment(row));
});

router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM environments WHERE id = ?').run(paramId(req));
  if (result.changes === 0) return res.status(404).json({ error: 'Environment not found' });
  res.status(204).send();
});

export default router;
