import fs from 'fs';
import path from 'path';
import initSqlJs, { Database as SqlJsDatabase, SqlValue } from 'sql.js';

const DB_PATH = path.join(__dirname, '../../data/aidepilot.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

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

  const SQL = await initSqlJs();

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
