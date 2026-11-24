import "server-only";
import { readFileSync } from "fs";
import path from "path";
import { Pool } from "pg";

/**
 * One tiny query layer for the whole app.
 *  - Production / dev:  Supabase Postgres through DATABASE_URL (node-postgres).
 *  - Local testing only: DDASH_PGLITE=1 runs an embedded Postgres (PGlite) with the
 *    same supabase/schema.sql, so no Supabase project is needed to try things out.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;
export type Q = (text: string, params?: unknown[]) => Promise<Row[]>;

interface PgLike {
  query(text: string, params?: unknown[]): Promise<{ rows: Row[] }>;
  transaction<T>(fn: (t: { query: PgLike["query"] }) => Promise<T>): Promise<T>;
}

const g = globalThis as unknown as { __ddashPool?: Pool; __ddashLite?: Promise<PgLike> };
const useLite = process.env.DDASH_PGLITE === "1";

function pool() {
  if (!g.__ddashPool) {
    const url = process.env.DATABASE_URL;

    if (!url) {
      throw new Error(
        "DATABASE_URL is not set. Add your Supabase connection string to .env.local (see README).",
      );
    }
    const local = /@(localhost|127\.0\.0\.1)/.test(url);
    g.__ddashPool = new Pool({
      connectionString: url,
      max: 5,
      idleTimeoutMillis: 10_000,
      ssl: local ? false : { rejectUnauthorized: false },
    });
  }
  return g.__ddashPool;
}

function lite(): Promise<PgLike> {
  g.__ddashLite ??= (async () => {
    const mod = "@electric-sql/pglite";
    const { PGlite } = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ mod);
    const db = new PGlite(process.env.DDASH_PGLITE_DIR || undefined);
    await db.exec(readFileSync(path.join(process.cwd(), "supabase", "schema.sql"), "utf8"));
    return db as unknown as PgLike;
  })();
  return g.__ddashLite;
}

export const query: Q = async (text, params = []) => {
  if (useLite) return (await (await lite()).query(text, params)).rows;
  return (await pool().query(text, params)).rows;
};

/** Runs fn inside one database transaction. Throwing rolls everything back. */
export async function tx<T>(fn: (q: Q) => Promise<T>): Promise<T> {
  if (useLite) {
    const db = await lite();
    return db.transaction((t) => fn(async (text, params = []) => (await t.query(text, params)).rows));
  }
  const client = await pool().connect();
  try {
    await client.query("begin");
    const out = await fn(async (text, params = []) => (await client.query(text, params)).rows);
    await client.query("commit");
    return out;
  } catch (e) {
    await client.query("rollback").catch(() => undefined);
    throw e;
  } finally {
    client.release();
  }
}

export const isUnique = (e: unknown) => (e as { code?: string })?.code === "23505";
export const isUuid = (v: unknown): v is string =>
  typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
