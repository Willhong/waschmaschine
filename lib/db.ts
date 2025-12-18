import { Database } from "bun:sqlite";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "waschmaschine.db");

// Ensure data directory exists
import fs from "fs";
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

export const db = new Database(DB_PATH);

// Initialize tables
db.run(`
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

db.run(`
  CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )
`);

db.run(`
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
db.run(`
  CREATE INDEX IF NOT EXISTS idx_access_logs_accessedAt
  ON access_logs(accessedAt DESC)
`);

db.run(`
  CREATE INDEX IF NOT EXISTS idx_access_logs_userId
  ON access_logs(userId)
`);
