import mysql from 'mysql2/promise';
import type { Pool, PoolConnection, ResultSetHeader } from 'mysql2/promise';

/**
 * One MySQL/MariaDB connection pool per process. Works with the MySQL database that comes with
 * Hostinger hosting, and with any other MySQL 8 or MariaDB 10.5+ server.
 *
 * SQL in this project is written to run on BOTH MySQL 8 and MariaDB (no RETURNING, no JSON column
 * type, no expression defaults), because hosts label MariaDB as "MySQL" and it is easy to be surprised.
 * All timestamps are UTC: every connection sets time_zone = +00:00 and JS dates are sent as UTC.
 */

const g = globalThis as unknown as { __enjazPool?: Pool };

export function databaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL belum diisi. Format: mysql://USER:PASSWORD@HOST:3306/NAMA_DATABASE (lihat CLAUDE.md, bagian Database).');
  }
  return url;
}

export function pool(): Pool {
  if (g.__enjazPool) return g.__enjazPool;

  const url = new URL(databaseUrl());
  if (url.protocol !== 'mysql:' && url.protocol !== 'mariadb:') {
    throw new Error('DATABASE_URL harus berawalan mysql://');
  }
  const p = mysql.createPool({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.slice(1)),
    charset: 'utf8mb4',
    timezone: 'Z',
    waitForConnections: true,
    connectionLimit: Number(process.env.DATABASE_POOL_MAX ?? 5),
    connectTimeout: 10_000,
    enableKeepAlive: true,
    decimalNumbers: true,
    supportBigNumbers: true,
    bigNumberStrings: false,
    // The app normally runs on the same Hostinger account as the database (host "localhost"), where TLS
    // is not needed. Turn it on with DATABASE_SSL=1 when connecting across the internet.
    ssl:
      process.env.DATABASE_SSL === '1'
        ? { rejectUnauthorized: process.env.DATABASE_SSL_INSECURE !== '1', ca: process.env.DATABASE_CA || undefined }
        : undefined,
  });
  p.pool.on('connection', (conn) => {
    conn.query("SET time_zone = '+00:00'");
  });
  g.__enjazPool = p;
  return p;
}

// Prepared statements everywhere: values are sent separately from the SQL text, never spliced into it.
type Param = string | number | boolean | bigint | Date | Buffer | null | undefined;
const clean = (params: Param[]) => params.map((p) => (p === undefined ? null : p));

export async function q<T = Record<string, unknown>>(sql: string, params: Param[] = []): Promise<T[]> {
  const [rows] = await pool().execute(sql, clean(params) as never[]);
  return rows as T[];
}

export async function q1<T = Record<string, unknown>>(sql: string, params: Param[] = []): Promise<T | null> {
  return (await q<T>(sql, params))[0] ?? null;
}

/** INSERT / UPDATE / DELETE. Returns insertId and affectedRows. */
export async function exec(sql: string, params: Param[] = []): Promise<ResultSetHeader> {
  const [res] = await pool().execute(sql, clean(params) as never[]);
  return res as ResultSetHeader;
}

export async function tx<T>(fn: (c: PoolConnection) => Promise<T>): Promise<T> {
  const c = await pool().getConnection();
  try {
    await c.beginTransaction();
    const out = await fn(c);
    await c.commit();
    return out;
  } catch (err) {
    await c.rollback().catch(() => {});
    throw err;
  } finally {
    c.release();
  }
}

/** Duplicate value in a UNIQUE column (MySQL error 1062). */
export function isDuplicateError(e: unknown): boolean {
  const err = e as { code?: string; errno?: number };
  return err.code === 'ER_DUP_ENTRY' || err.errno === 1062;
}

export function parseJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value !== 'string') return value as T; // some servers already return parsed JSON
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export async function closePool(): Promise<void> {
  if (g.__enjazPool) {
    await g.__enjazPool.end();
    g.__enjazPool = undefined;
  }
}
