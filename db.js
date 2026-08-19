import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS kv_store (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL DEFAULT '{}',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  const keys = ["users", "accounts", "messages", "blocked_emails", "signal_config", "candle_overrides"];
  for (const k of keys) {
    const defaults = k === "users" || k === "blocked_emails" || k === "candle_overrides" ? "[]" : "{}";
    await pool.query(
      `INSERT INTO kv_store (key, value) VALUES ($1, $2::jsonb) ON CONFLICT (key) DO NOTHING`,
      [k, defaults]
    );
  }
  await pool.query(`
    UPDATE kv_store
    SET value = value || '{"adminWallets": {"trc20": "", "erc20": "", "bep20": ""}}'::jsonb
    WHERE key = 'signal_config'
    AND value->'adminWallets' IS NULL
  `);
}

export async function dbRead(key) {
  const r = await pool.query("SELECT value FROM kv_store WHERE key = $1", [key]);
  if (!r.rows.length) return key === "users" || key === "blocked_emails" || key === "candle_overrides" ? [] : {};
  return r.rows[0].value;
}

export async function dbWrite(key, value) {
  await pool.query(
    "INSERT INTO kv_store (key, value, updated_at) VALUES ($1, $2::jsonb, NOW()) ON CONFLICT (key) DO UPDATE SET value = $2::jsonb, updated_at = NOW()",
    [key, JSON.stringify(value)]
  );
}

export async function dbDelete(key) {
  await pool.query("DELETE FROM kv_store WHERE key = $1", [key]);
}

// ---- Backup support ----
// These work on the whole table rather than a known list of keys: the point of a backup is that it
// stays complete even when the app grows a key nobody remembered to add to a list.

// Metadata only — never loads the values, so listing snapshots is cheap even when they are large.
export async function dbListKeys() {
  const r = await pool.query(
    "SELECT key, pg_column_size(value) AS bytes, updated_at FROM kv_store ORDER BY key"
  );
  return r.rows.map(row => ({
    key: row.key,
    bytes: Number(row.bytes) || 0,
    updatedAt: row.updated_at,
  }));
}

export async function dbDumpAll(excludePrefixes = []) {
  const r = await pool.query("SELECT key, value FROM kv_store ORDER BY key");
  const out = {};
  for (const row of r.rows) {
    if (excludePrefixes.some(p => row.key.startsWith(p))) continue;
    out[row.key] = row.value;
  }
  return out;
}

// All-or-nothing restore. One transaction, so a failure partway through cannot leave the database
// as a mix of restored and live rows — which would be worse than either state on its own.
// Keys absent from the snapshot are left alone rather than deleted: a snapshot taken before some
// feature existed should not wipe that feature's data.
export async function dbRestoreAll(entries) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const [key, value] of Object.entries(entries)) {
      await client.query(
        "INSERT INTO kv_store (key, value, updated_at) VALUES ($1, $2::jsonb, NOW()) ON CONFLICT (key) DO UPDATE SET value = $2::jsonb, updated_at = NOW()",
        [key, JSON.stringify(value)]
      );
    }
    await client.query("COMMIT");
    return Object.keys(entries).length;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

export { pool };
