import { pool } from "./db";

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      google_id TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS counter (
      id INTEGER PRIMARY KEY DEFAULT 1,
      value INTEGER DEFAULT 0,
      CONSTRAINT single_row CHECK (id = 1)
    );

    INSERT INTO counter (id, value)
    VALUES (1, 0)
    ON CONFLICT DO NOTHING;

    CREATE TABLE IF NOT EXISTS increments (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  console.log("Migration done");
  await pool.end();
}

migrate().catch(console.error);
