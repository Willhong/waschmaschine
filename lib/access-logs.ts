import { db } from "./db";

export type ActionType =
  | "page_view"
  | "reservation_create"
  | "reservation_delete"
  | "profile_update"
  | "sse_connect"
  | "sse_disconnect";

export interface AccessLog {
  id: number;
  userId: string | null;
  userName: string | null;
  action: ActionType;
  detail: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  accessedAt: string;
}

export interface LogAccessParams {
  userId?: string;
  userName?: string;
  action: ActionType;
  detail?: string;
  ipAddress?: string;
  userAgent?: string;
}

export function logAccess(params: LogAccessParams): AccessLog {
  const accessedAt = new Date().toISOString();

  const result = db.run(
    `INSERT INTO access_logs (userId, userName, action, detail, ipAddress, userAgent, accessedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      params.userId || null,
      params.userName || null,
      params.action,
      params.detail || null,
      params.ipAddress || null,
      params.userAgent || null,
      accessedAt,
    ]
  );

  return {
    id: Number(result.lastInsertRowid),
    userId: params.userId || null,
    userName: params.userName || null,
    action: params.action,
    detail: params.detail || null,
    ipAddress: params.ipAddress || null,
    userAgent: params.userAgent || null,
    accessedAt,
  };
}

export interface GetLogsOptions {
  limit?: number;
  offset?: number;
  userId?: string;
  action?: ActionType;
  startDate?: string;
  endDate?: string;
}

export function getAccessLogs(options: GetLogsOptions = {}): AccessLog[] {
  const { limit = 100, offset = 0, userId, action, startDate, endDate } = options;

  let query = "SELECT * FROM access_logs WHERE 1=1";
  const params: (string | number)[] = [];

  if (userId) {
    query += " AND userId = ?";
    params.push(userId);
  }

  if (action) {
    query += " AND action = ?";
    params.push(action);
  }

  if (startDate) {
    query += " AND accessedAt >= ?";
    params.push(startDate);
  }

  if (endDate) {
    query += " AND accessedAt <= ?";
    params.push(endDate);
  }

  query += " ORDER BY accessedAt DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  return db.query(query).all(...params) as AccessLog[];
}

export function getAccessLogsCount(options: Omit<GetLogsOptions, "limit" | "offset"> = {}): number {
  const { userId, action, startDate, endDate } = options;

  let query = "SELECT COUNT(*) as count FROM access_logs WHERE 1=1";
  const params: string[] = [];

  if (userId) {
    query += " AND userId = ?";
    params.push(userId);
  }

  if (action) {
    query += " AND action = ?";
    params.push(action);
  }

  if (startDate) {
    query += " AND accessedAt >= ?";
    params.push(startDate);
  }

  if (endDate) {
    query += " AND accessedAt <= ?";
    params.push(endDate);
  }

  const result = db.query(query).get(...params) as { count: number };
  return result.count;
}

export function getRecentAccessSummary(): {
  totalToday: number;
  uniqueUsersToday: number;
  actionCounts: Record<string, number>;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();

  const totalToday = db
    .query("SELECT COUNT(*) as count FROM access_logs WHERE accessedAt >= ?")
    .get(todayStr) as { count: number };

  const uniqueUsers = db
    .query(
      "SELECT COUNT(DISTINCT userId) as count FROM access_logs WHERE accessedAt >= ? AND userId IS NOT NULL"
    )
    .get(todayStr) as { count: number };

  const actionCountsResult = db
    .query(
      "SELECT action, COUNT(*) as count FROM access_logs WHERE accessedAt >= ? GROUP BY action"
    )
    .all(todayStr) as { action: string; count: number }[];

  const actionCounts: Record<string, number> = {};
  for (const row of actionCountsResult) {
    actionCounts[row.action] = row.count;
  }

  return {
    totalToday: totalToday.count,
    uniqueUsersToday: uniqueUsers.count,
    actionCounts,
  };
}
