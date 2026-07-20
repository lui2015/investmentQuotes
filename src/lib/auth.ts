import crypto from "crypto";
import { initDb, getDb } from "./db";

const SESSION_DAYS = 30;
export const SESSION_MAX_AGE = SESSION_DAYS * 24 * 3600; // 秒
export const SESSION_COOKIE = "iq_session";

export interface AuthUser {
  id: string;
  username: string;
  isAdmin: boolean;
}

// ---------- 密码哈希（scrypt，Node 内置，无需额外依赖） ----------
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return (
    candidate.length === expected.length &&
    crypto.timingSafeEqual(candidate, expected)
  );
}

// ---------- 账号 ----------
export function registerUser(username: string, password: string): AuthUser {
  initDb();
  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get(username);
  if (existing) {
    throw new Error("用户名已被注册");
  }
  const id = crypto.randomUUID();
  db.prepare(
    "INSERT INTO users (id, username, password_hash, is_admin) VALUES (?, ?, ?, 0)",
  ).run(id, username, hashPassword(password));
  return { id, username, isAdmin: false };
}

export function authenticateUser(
  username: string,
  password: string,
): AuthUser | null {
  initDb();
  const db = getDb();
  const row = db
    .prepare(
      "SELECT id, username, password_hash, is_admin FROM users WHERE username = ?",
    )
    .get(username) as
    | { id: string; username: string; password_hash: string; is_admin: number }
    | undefined;
  if (!row) return null;
  if (!verifyPassword(password, row.password_hash)) return null;
  return { id: row.id, username: row.username, isAdmin: row.is_admin === 1 };
}

// ---------- 管理员账号（幂等初始化） ----------
let adminSeeded = false;
export function ensureAdminUser(): void {
  if (adminSeeded) return;
  initDb();
  const db = getDb();
  const ADMIN_USER = "luli";
  const ADMIN_PASS = "luli116574";
  const existing = db
    .prepare("SELECT id, is_admin FROM users WHERE username = ?")
    .get(ADMIN_USER) as { id: string; is_admin: number } | undefined;
  if (!existing) {
    const id = crypto.randomUUID();
    db.prepare(
      "INSERT INTO users (id, username, password_hash, is_admin) VALUES (?, ?, ?, 1)",
    ).run(id, ADMIN_USER, hashPassword(ADMIN_PASS));
  } else if (existing.is_admin !== 1) {
    db.prepare("UPDATE users SET is_admin = 1 WHERE id = ?").run(existing.id);
  }
  adminSeeded = true;
}

// ---------- 会话 ----------
export function createSession(userId: string): {
  token: string;
  maxAge: number;
} {
  initDb();
  const db = getDb();
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(
    Date.now() + SESSION_MAX_AGE * 1000,
  ).toISOString();
  db.prepare(
    "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
  ).run(token, userId, expiresAt);
  return { token, maxAge: SESSION_MAX_AGE };
}

export function getUserBySession(token: string | undefined): AuthUser | null {
  if (!token) return null;
  initDb();
  const db = getDb();
  const session = db
    .prepare("SELECT user_id, expires_at FROM sessions WHERE token = ?")
    .get(token) as { user_id: string; expires_at: string } | undefined;
  if (!session) return null;
  if (new Date(session.expires_at).getTime() < Date.now()) {
    db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
    return null;
  }
  const user = db
    .prepare("SELECT id, username, is_admin FROM users WHERE id = ?")
    .get(session.user_id) as
    | { id: string; username: string; is_admin: number }
    | undefined;
  return user
    ? { id: user.id, username: user.username, isAdmin: user.is_admin === 1 }
    : null;
}

export function deleteSession(token: string): void {
  initDb();
  getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

// ---------- 收藏（按账号隔离） ----------
export function getFavorites(userId: string): string[] {
  initDb();
  const rows = getDb()
    .prepare(
      "SELECT quote_id FROM user_favorites WHERE user_id = ? ORDER BY created_at DESC",
    )
    .all(userId) as { quote_id: string }[];
  return rows.map((r) => r.quote_id);
}

export function addFavorite(userId: string, quoteId: string): void {
  initDb();
  getDb()
    .prepare(
      "INSERT OR IGNORE INTO user_favorites (user_id, quote_id) VALUES (?, ?)",
    )
    .run(userId, quoteId);
}

export function removeFavorite(userId: string, quoteId: string): void {
  initDb();
  getDb()
    .prepare(
      "DELETE FROM user_favorites WHERE user_id = ? AND quote_id = ?",
    )
    .run(userId, quoteId);
}

export function clearFavorites(userId: string): void {
  initDb();
  getDb()
    .prepare("DELETE FROM user_favorites WHERE user_id = ?")
    .run(userId);
}
