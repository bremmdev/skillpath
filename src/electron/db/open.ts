import path from "node:path";
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { migrations } from "./migrations.js";
import { validateMigrations } from "./validate.js";

/**
 * Opens a SQLite database at `dbPath`, applies connection pragmas, runs any
 * pending migrations, and returns the singleton handle.
 */
export function openDatabase(dbPath: string): DatabaseSync {
  // Ensure the database directory exists
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const sqlite = new DatabaseSync(dbPath, {
    enableForeignKeyConstraints: true,
    timeout: 5000, // busy timeout
  });

  try {
    sqlite.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      PRAGMA temp_store = MEMORY;
      PRAGMA cache_size = -8000;
    `);

    runMigrations(sqlite);

    return sqlite;
  } catch (error) {
    sqlite.close();
    throw error;
  }
}

/**
 * Checkpoints the WAL, runs optimize, and closes the handle. The caller owns the
 * reference; this deliberately does not touch any module-level singleton (see
 * closeDatabase in ./index.ts for the app's singleton wrapper).
 */
export function closeConnection(db: DatabaseSync): void {
  db.exec("PRAGMA wal_checkpoint(TRUNCATE);");
  db.exec("PRAGMA optimize;");
  db.close();
}

/**
 * Applies migrations whose version is greater than the database's current
 * `user_version`, each in its own transaction, advancing `user_version` as it
 * goes so every migration runs exactly once.
 */
function runMigrations(sqlite: DatabaseSync): void {
  // Fail fast on a malformed migration list before touching the database.
  validateMigrations(migrations);

  const row = sqlite.prepare("PRAGMA user_version").get() as
    | { user_version: number }
    | undefined;

  let currentVersion = Number(row?.user_version ?? 0);

  for (const migration of migrations) {
    if (migration.version <= currentVersion) continue;

    sqlite.exec("BEGIN IMMEDIATE;");
    try {
      sqlite.exec(migration.sql);
      // user_version only accepts a literal, not a bound parameter.
      sqlite.exec(`PRAGMA user_version = ${migration.version}`);
      sqlite.exec("COMMIT");

      currentVersion = migration.version;
    } catch (error) {
      sqlite.exec("ROLLBACK");
      throw new Error(
        `Failed to apply migration ${migration.version} (${migration.name})`,
        { cause: error },
      );
    }
  }
}
