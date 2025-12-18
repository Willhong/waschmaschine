import { Database } from "bun:sqlite";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "waschmaschine.db");

let _db: Database | null = null;
let _initialized = false;

function initializeDatabase(): Database {
  if (_db && _initialized) {
    return _db;
  }

  // Ensure data directory exists
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  _db = new Database(DB_PATH);

  // Initialize tables
  _db.run(`
    CREATE TABLE IF NOT EXISTS reservations (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      timeSlot TEXT NOT NULL,
      userId TEXT NOT NULL,
      userColor TEXT,
      createdAt TEXT NOT NULL,
      UNIQUE(date, timeSlot)
    )
  `);

  _db.run(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  _db.run(`
    CREATE TABLE IF NOT EXISTS access_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT,
      userName TEXT,
      action TEXT NOT NULL,
      detail TEXT,
      ipAddress TEXT,
      userAgent TEXT,
      accessedAt TEXT NOT NULL
    )
  `);

  // Create index for faster queries
  _db.run(`
    CREATE INDEX IF NOT EXISTS idx_access_logs_accessedAt
    ON access_logs(accessedAt DESC)
  `);

  _db.run(`
    CREATE INDEX IF NOT EXISTS idx_access_logs_userId
    ON access_logs(userId)
  `);

  _initialized = true;
  return _db;
}

// Export a getter that lazily initializes the database
export function getDb(): Database {
  return initializeDatabase();
}

// For backward compatibility, export db as a getter
// This will only initialize when actually accessed at runtime
export const db = new Proxy({} as Database, {
  get(_, prop) {
    const database = getDb();
    const value = (database as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === "function") {
      return value.bind(database);
    }
    return value;
  },
});
