import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { Folder } from '../types';
import { paramId } from '../utils/params';

const router = Router();

router.get('/workspace/:workspaceId', (req: Request, res: Response) => {
  const db = getDb();
  const folders = db
    .prepare('SELECT * FROM folders WHERE workspace_id = ? ORDER BY sort_order, name')
    .all(paramId(req, 'workspaceId')) as unknown as Folder[];
  res.json(folders);
});

router.post('/', (req: Request, res: Response) => {
  const db = getDb();
  const { workspace_id, parent_id, name } = req.body;

  if (!workspace_id || !name?.trim()) {
    return res.status(400).json({ error: 'workspace_id and name are required' });
  }

  const id = uuidv4();
  db.prepare('INSERT INTO folders (id, workspace_id, parent_id, name) VALUES (?, ?, ?, ?)').run(
    id,
    workspace_id,
    parent_id ?? null,
    name.trim()
  );

  const folder = db.prepare('SELECT * FROM folders WHERE id = ?').get(id) as unknown as Folder;
  res.status(201).json(folder);
});

router.put('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const { name, parent_id } = req.body;
  const existing = db.prepare('SELECT * FROM folders WHERE id = ?').get(paramId(req));
  if (!existing) return res.status(404).json({ error: 'Folder not found' });

  db.prepare(
    `UPDATE folders SET name = COALESCE(?, name), parent_id = COALESCE(?, parent_id), updated_at = datetime('now') WHERE id = ?`
  ).run(name?.trim() ?? null, parent_id !== undefined ? parent_id : null, paramId(req));

  const folder = db.prepare('SELECT * FROM folders WHERE id = ?').get(paramId(req)) as unknown as Folder;
  res.json(folder);
});

router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM folders WHERE id = ?').run(paramId(req));
  if (result.changes === 0) return res.status(404).json({ error: 'Folder not found' });
  res.status(204).send();
});

export default router;
