import fs from 'fs';
import path from 'path';
import initSqlJs, { Database as SqlJsDatabase, SqlValue } from 'sql.js';

function resolveDbPath(): string {
  if (process.env.AIDEPLOT_DATA_DIR) {
    return path.join(process.env.AIDEPLOT_DATA_DIR, 'aidepilot.db');
  }
  return path.join(__dirname, '../../data/aidepilot.db');
}

function resolveSchemaPath(): string {
  if (process.env.AIDEPLOT_SCHEMA_PATH && fs.existsSync(process.env.AIDEPLOT_SCHEMA_PATH)) {
    return process.env.AIDEPLOT_SCHEMA_PATH;
  }
  const nextToDist = path.join(__dirname, 'schema.sql');
  if (fs.existsSync(nextToDist)) return nextToDist;
  return path.join(__dirname, '../../src/db/schema.sql');
}

function resolveWasmDir(): string {
  if (process.env.AIDEPLOT_SQLJS_DIR && fs.existsSync(process.env.AIDEPLOT_SQLJS_DIR)) {
    return process.env.AIDEPLOT_SQLJS_DIR;
  }
  // Prefer unpacked path when running from Electron asar
  const candidates = [
    path.join(__dirname, '../../../node_modules/sql.js/dist'),
    path.join(__dirname, '../../../../node_modules/sql.js/dist'),
    path.join(process.cwd(), 'node_modules/sql.js/dist'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'sql-wasm.wasm'))) return dir;
  }
  return candidates[0];
}

const DB_PATH = resolveDbPath();
const SCHEMA_PATH = resolveSchemaPath();

export interface StatementResult {
  changes: number;
}

export interface PreparedStatement {
  run(...params: unknown[]): StatementResult;
  get(...params: unknown[]): Record<string, unknown> | undefined;
  all(...params: unknown[]): Record<string, unknown>[];
}

export interface DatabaseWrapper {
  prepare(sql: string): PreparedStatement;
  exec(sql: string): void;
}

let wrapper: DatabaseWrapper | null = null;

function createWrapper(db: SqlJsDatabase): DatabaseWrapper {
  const save = () => {
    const data = db.export();
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  };

  return {
    prepare(sql: string): PreparedStatement {
      return {
        run(...params: unknown[]) {
          const stmt = db.prepare(sql);
          if (params.length) stmt.bind(params as SqlValue[]);
          stmt.step();
          const changes = db.getRowsModified();
          stmt.free();
          save();
          return { changes };
        },
        get(...params: unknown[]) {
          const stmt = db.prepare(sql);
          if (params.length) stmt.bind(params as SqlValue[]);
          const hasRow = stmt.step();
          const row = hasRow ? (stmt.getAsObject() as Record<string, unknown>) : undefined;
          stmt.free();
          return row;
        },
        all(...params: unknown[]) {
          const stmt = db.prepare(sql);
          if (params.length) stmt.bind(params as SqlValue[]);
          const rows: Record<string, unknown>[] = [];
          while (stmt.step()) {
            rows.push(stmt.getAsObject() as Record<string, unknown>);
          }
          stmt.free();
          return rows;
        },
      };
    },
    exec(sql: string) {
      db.run(sql);
      save();
    },
  };
}

export async function initDb(): Promise<DatabaseWrapper> {
  if (wrapper) return wrapper;

  const wasmDir = resolveWasmDir();
  const SQL = await initSqlJs({
    locateFile: (file) => path.join(wasmDir, file),
  });

  let db: SqlJsDatabase;
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  db.run(schema);

  wrapper = createWrapper(db);

  if (!fs.existsSync(DB_PATH)) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
  }

  return wrapper;
}

export function getDb(): DatabaseWrapper {
  if (!wrapper) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return wrapper;
}

export function closeDb(): void {
  wrapper = null;
}
