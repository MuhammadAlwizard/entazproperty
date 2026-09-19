// TEMPORARY database connection check. Replaces the app while DIAG_BUILD is used, then is removed again.
// Reports how the MySQL server reacts to different ways of connecting. Never prints the password.
const http = require('http');
const fs = require('fs');
const dns = require('dns');
const os = require('os');
const crypto = require('crypto');

// Access needs ?k=<token>. Only the hash of the token is stored here.
const TOKEN_SHA256 = 'b2371ca4f2983fc408c1f87f07fa2c387c8e930d485bacba915fb614367dac62';

function sha256(s) { return crypto.createHash('sha256').update(String(s)).digest('hex'); }

async function attempt(label, cfg) {
  const started = Date.now();
  let conn;
  try {
    const mysql = require('mysql2/promise');
    conn = await mysql.createConnection({ ...cfg, connectTimeout: 8000 });
    const [rows] = await conn.query('SELECT CURRENT_USER() AS current_user_name, USER() AS client, DATABASE() AS db, VERSION() AS version');
    return label + ': OK ' + JSON.stringify(rows[0]) + ' (' + (Date.now() - started) + 'ms)';
  } catch (e) {
    return label + ': FAIL code=' + e.code + ' errno=' + e.errno + ' sqlState=' + e.sqlState + ' message=' + e.message;
  } finally {
    if (conn) await conn.end().catch(() => {});
  }
}

async function report() {
  const out = [];
  out.push('node ' + process.version + ' on ' + os.platform() + ' host=' + os.hostname());
  try { out.push('mysql2 ' + require('mysql2/package.json').version); } catch (e) { out.push('mysql2 NOT FOUND: ' + e.message); }
  out.push('env DATABASE_URL present: ' + Boolean(process.env.DATABASE_URL));
  out.push('env PORT=' + process.env.PORT);

  let url;
  try { url = new URL(process.env.DATABASE_URL || ''); } catch (e) { out.push('DATABASE_URL is not a valid URL: ' + e.message); return out.join('\n'); }
  const user = decodeURIComponent(url.username);
  const password = decodeURIComponent(url.password);
  const database = decodeURIComponent(url.pathname.slice(1));
  out.push('parsed: protocol=' + url.protocol + ' user=' + user + ' host=' + url.hostname + ' port=' + (url.port || '(default 3306)') + ' database=' + database);
  out.push('password: length=' + password.length + ' hasWhitespace=' + /\s/.test(password) + ' nonAlphanumeric=' + (password.match(/[^A-Za-z0-9]/g) || []).length + ' rawUrlPasswordLength=' + url.password.length);
  out.push('user length=' + user.length + ' database length=' + database.length);

  await new Promise((resolve) => dns.lookup('localhost', { all: true }, (err, addrs) => { out.push('dns localhost -> ' + (err ? err.message : JSON.stringify(addrs))); resolve(); }));

  const sockets = ['/var/run/mysqld/mysqld.sock', '/run/mysqld/mysqld.sock', '/tmp/mysql.sock', '/var/lib/mysql/mysql.sock', '/var/lib/mysql/mysqld.sock', '/tmp/mysqld.sock'];
  const found = sockets.filter((s) => { try { return fs.existsSync(s); } catch { return false; } });
  out.push('unix sockets found: ' + (found.length ? found.join(', ') : '(none)'));

  const base = { user, password, database, port: Number(url.port || 3306) };
  const noDb = { user, password, port: Number(url.port || 3306) };
  out.push('');
  out.push(await attempt('A as configured (host ' + url.hostname + ')', { ...base, host: url.hostname }));
  out.push(await attempt('B host localhost', { ...base, host: 'localhost' }));
  out.push(await attempt('C host 127.0.0.1', { ...base, host: '127.0.0.1' }));
  out.push(await attempt('D host ::1', { ...base, host: '::1' }));
  out.push(await attempt('E as configured, without selecting a database', { ...noDb, host: url.hostname }));
  for (const s of found) out.push(await attempt('F unix socket ' + s, { ...base, socketPath: s }));
  return out.join('\n');
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  const k = new URL(req.url, 'http://x').searchParams.get('k');
  if (!k || sha256(k) !== TOKEN_SHA256) { res.statusCode = 200; res.end('diagnostic mode: add ?k=<token>\n'); return; }
  try { res.end((await report()) + '\n'); } catch (e) { res.statusCode = 500; res.end('report failed: ' + e.message + '\n'); }
});
server.listen(Number(process.env.PORT) || 3000, '0.0.0.0');
