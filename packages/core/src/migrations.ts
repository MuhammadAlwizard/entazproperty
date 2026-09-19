import { pool } from './db';

/**
 * Append-only list. Never edit a migration that has already run anywhere, add a new one.
 *
 * MySQL cannot roll back DDL, so a migration is a list of statements that are each safe to run
 * twice (CREATE TABLE IF NOT EXISTS). If one fails halfway, fix the cause and run it again.
 *
 * The database is not exposed to the internet: only your own hosting account connects to it, so
 * there is no public API in front of these tables. Keep "Remote MySQL" in hPanel switched off, or
 * limited to your own IP address, unless you really need it.
 */
const TABLE_OPTIONS = 'ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';

export const MIGRATIONS: { id: string; statements: string[] }[] = [
  {
    id: '001_baseline',
    statements: [
      `CREATE TABLE IF NOT EXISTS listings (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        category VARCHAR(10) NOT NULL,
        slug VARCHAR(120) NOT NULL,
        title VARCHAR(160) NOT NULL,
        summary VARCHAR(400) NOT NULL DEFAULT '',
        description TEXT NOT NULL,
        price INT UNSIGNED NOT NULL DEFAULT 0,
        location VARCHAR(200) NOT NULL DEFAULT '',
        address VARCHAR(400) NOT NULL DEFAULT '',
        maps_url VARCHAR(600) NOT NULL DEFAULT '',
        images LONGTEXT NOT NULL,
        meta LONGTEXT NOT NULL,
        published TINYINT(1) NOT NULL DEFAULT 1,
        featured TINYINT(1) NOT NULL DEFAULT 0,
        sort_order INT NOT NULL DEFAULT 0,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        UNIQUE KEY uq_listings_slug (slug),
        KEY idx_listings_category (category, published)
      ) ${TABLE_OPTIONS}`,

      `CREATE TABLE IF NOT EXISTS testimonials (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        origin VARCHAR(160) NOT NULL DEFAULT '',
        quote TEXT NOT NULL,
        photo VARCHAR(300) NOT NULL DEFAULT '',
        rating TINYINT UNSIGNED NOT NULL DEFAULT 5,
        published TINYINT(1) NOT NULL DEFAULT 1,
        sort_order INT NOT NULL DEFAULT 0
      ) ${TABLE_OPTIONS}`,

      `CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(60) NOT NULL PRIMARY KEY,
        setting_value TEXT NOT NULL
      ) ${TABLE_OPTIONS}`,

      `CREATE TABLE IF NOT EXISTS admins (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(200) NOT NULL,
        password_hash VARCHAR(300) NOT NULL,
        must_change_password TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        UNIQUE KEY uq_admins_email (email)
      ) ${TABLE_OPTIONS}`,

      // Server-side sessions: the cookie only carries a random token, the database stores its SHA-256.
      // A row can be revoked at any time (logout, password change, "sign out other devices").
      `CREATE TABLE IF NOT EXISTS admin_sessions (
        id CHAR(36) NOT NULL PRIMARY KEY,
        token_hash CHAR(64) NOT NULL,
        admin_id INT UNSIGNED NOT NULL,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        last_seen_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        expires_at DATETIME(3) NOT NULL,
        revoked_at DATETIME(3) NULL,
        ip VARCHAR(64) NOT NULL DEFAULT '',
        user_agent VARCHAR(200) NOT NULL DEFAULT '',
        UNIQUE KEY uq_admin_sessions_token (token_hash),
        KEY idx_admin_sessions_admin (admin_id),
        CONSTRAINT fk_admin_sessions_admin FOREIGN KEY (admin_id) REFERENCES admins (id) ON DELETE CASCADE
      ) ${TABLE_OPTIONS}`,

      `CREATE TABLE IF NOT EXISTS login_attempts (
        attempt_key VARCHAR(220) NOT NULL PRIMARY KEY,
        fail_count INT NOT NULL DEFAULT 0,
        first_at DATETIME(3) NOT NULL
      ) ${TABLE_OPTIONS}`,

      `CREATE TABLE IF NOT EXISTS audit_log (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        admin_email VARCHAR(200) NOT NULL DEFAULT '',
        action VARCHAR(60) NOT NULL,
        target VARCHAR(300) NOT NULL DEFAULT '',
        detail TEXT NOT NULL,
        ip VARCHAR(64) NOT NULL DEFAULT '',
        KEY idx_audit_log_created (created_at)
      ) ${TABLE_OPTIONS}`,

      // Photos live in the database, not on disk: the public site and the admin panel are separate
      // Node.js apps that do not share a disk.
      `CREATE TABLE IF NOT EXISTS uploads (
        id CHAR(36) NOT NULL PRIMARY KEY,
        ext VARCHAR(4) NOT NULL,
        mime VARCHAR(20) NOT NULL,
        bytes LONGBLOB NOT NULL,
        size INT UNSIGNED NOT NULL,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
      ) ${TABLE_OPTIONS}`,
    ],
  },
];

/** Applies pending migrations in order. Safe to run repeatedly and from two apps at once. Returns the ids it applied. */
export async function migrate(): Promise<string[]> {
  const conn = await pool().getConnection();
  try {
    // A named lock stops two apps that boot at the same moment from migrating at the same time.
    await conn.query("SELECT GET_LOCK('enjaz_migrate', 60)");
    await conn.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         id VARCHAR(100) NOT NULL PRIMARY KEY,
         applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
       ) ${TABLE_OPTIONS}`,
    );
    const [rows] = await conn.query('SELECT id FROM schema_migrations');
    const done = new Set((rows as { id: string }[]).map((r) => r.id));
    const applied: string[] = [];
    for (const m of MIGRATIONS) {
      if (done.has(m.id)) continue;
      for (const sql of m.statements) await conn.query(sql);
      await conn.query('INSERT INTO schema_migrations (id) VALUES (?)', [m.id]);
      applied.push(m.id);
    }
    return applied;
  } finally {
    await conn.query("SELECT RELEASE_LOCK('enjaz_migrate')").catch(() => {});
    conn.release();
  }
}
