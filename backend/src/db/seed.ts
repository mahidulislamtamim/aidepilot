import { v4 as uuidv4 } from 'uuid';
import { closeDb, initDb } from './database';

async function seed() {
  const db = await initDb();

  const existing = db.prepare('SELECT COUNT(*) as count FROM workspaces').get() as { count: number };
  if (existing.count > 0) {
    console.log('Database already seeded. Skipping.');
    closeDb();
    process.exit(0);
  }

  const wsId = uuidv4();
  db.prepare('INSERT INTO workspaces (id, name, description) VALUES (?, ?, ?)').run(
    wsId,
    'Demo Workspace',
    'Example API requests to get you started'
  );

  const folderId = uuidv4();
  db.prepare('INSERT INTO folders (id, workspace_id, name) VALUES (?, ?, ?)').run(
    folderId,
    wsId,
    'JSONPlaceholder'
  );

  const examples = [
    {
      name: 'Get All Posts',
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/posts',
      body_type: 'json',
      body: '',
      headers: [] as Array<{ key: string; value: string }>,
      params: [{ key: '_limit', value: '10' }],
    },
    {
      name: 'Get Single Post',
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/posts/1',
      body_type: 'json',
      body: '',
      headers: [],
      params: [],
    },
    {
      name: 'Create Post',
      method: 'POST',
      url: 'https://jsonplaceholder.typicode.com/posts',
      body_type: 'json',
      body: JSON.stringify({ title: 'AidePilot Test', body: 'Hello from AidePilot!', userId: 1 }, null, 2),
      headers: [{ key: 'Content-Type', value: 'application/json' }],
      params: [],
    },
    {
      name: 'Update Post',
      method: 'PUT',
      url: 'https://jsonplaceholder.typicode.com/posts/1',
      body_type: 'json',
      body: JSON.stringify({ id: 1, title: 'Updated Title', body: 'Updated body', userId: 1 }, null, 2),
      headers: [{ key: 'Content-Type', value: 'application/json' }],
      params: [],
    },
    {
      name: 'Delete Post',
      method: 'DELETE',
      url: 'https://jsonplaceholder.typicode.com/posts/1',
      body_type: 'json',
      body: '',
      headers: [],
      params: [],
    },
  ];

  for (const ex of examples) {
    const reqId = uuidv4();
    db.prepare(
      `INSERT INTO requests (id, workspace_id, folder_id, name, method, url, body_type, body)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(reqId, wsId, folderId, ex.name, ex.method, ex.url, ex.body_type, ex.body);

    ex.headers.forEach((h, i) => {
      db.prepare(
        'INSERT INTO request_headers (id, request_id, key, value, enabled, sort_order) VALUES (?, ?, ?, ?, 1, ?)'
      ).run(uuidv4(), reqId, h.key, h.value, i);
    });

    ex.params.forEach((p, i) => {
      db.prepare(
        'INSERT INTO request_params (id, request_id, key, value, enabled, sort_order) VALUES (?, ?, ?, ?, 1, ?)'
      ).run(uuidv4(), reqId, p.key, p.value, i);
    });
  }

  const envId = uuidv4();
  db.prepare('INSERT INTO environments (id, workspace_id, name, variables, is_active) VALUES (?, ?, ?, ?, 1)').run(
    envId,
    wsId,
    'Development',
    JSON.stringify([
      { key: 'base_url', value: 'https://jsonplaceholder.typicode.com', enabled: true },
      { key: 'api_key', value: 'your-api-key-here', enabled: true },
    ])
  );

  console.log('Seed data created successfully!');
  closeDb();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
