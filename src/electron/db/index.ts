import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { app } from "electron";
import { migrations } from "./migrations.js";
import { validateMigrations } from "./validate.js";
import fs from "node:fs";

let db: DatabaseSync | undefined;

/**
 * Opens (once) the app's SQLite database, applies connection pragmas, runs any
 * pending migrations, and returns the cached singleton handle.
 *
 * Must be called after the Electron app is ready, since it resolves the file
 * location via `app.getPath("userData")`
 */
export function getDatabase(): DatabaseSync {
  if (db) return db;

  if (!app.isReady()) {
    throw new Error("getDatabase() must be called after Electron app is ready");
  }

  const dbDir = path.join(app.getPath("userData"), "database");

  // Ensure the database directory exists
  fs.mkdirSync(dbDir, { recursive: true });

  const dbPath = path.join(dbDir, "skillpath.db");

  const sqlite = new DatabaseSync(dbPath, {
    enableForeignKeyConstraints: true,
    timeout: 5000, // busy timeout,
  });

  try {
    sqlite.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      PRAGMA temp_store = MEMORY;
      PRAGMA cache_size = -8000;
    `);

    runMigrations(sqlite);

    db = sqlite;
    return db;
  } catch (error) {
    sqlite.close();
    throw error;
  }
}

export function closeDatabase(): void {
  if (!db) {
    return;
  }

  db.exec("PRAGMA wal_checkpoint(TRUNCATE);");
  db.exec("PRAGMA optimize;");
  db.close();
  db = undefined;
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
