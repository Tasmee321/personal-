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
  const scDefault = JSON.stringify({
    signalActive: false, globalDailyLimit: 3,
    referralSignalTime: "14:00", referralSignalWindow: 60,
    referralDirection: "up", referralSymbol: "BTCUSDT",
    adminWallets: { trc20: "", erc20: "", bep20: "" },
  });
  await pool.query(
    `UPDATE kv_store SET value = $1::jsonb WHERE key = 'signal_config' AND value = '{}'::jsonb`,
    [scDefault]
  );
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

export { pool };
