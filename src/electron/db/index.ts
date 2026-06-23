import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { app } from "electron";
import { migrations } from "./migrations.js";

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

  const dbPath = path.join(app.getPath("userData"), "skillpath.db");
  const sqlite = new DatabaseSync(dbPath);

  sqlite.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA synchronous = NORMAL;
    PRAGMA temp_store = MEMORY;
    PRAGMA cache_size = 2000;
    PRAGMA busy_timeout = 5000;
  `);

  runMigrations(sqlite);

  db = sqlite;
  return db;
}

/**
 * Applies migrations whose version is greater than the database's current
 * `user_version`, each in its own transaction, advancing `user_version` as it
 * goes so every migration runs exactly once.
 */
function runMigrations(sqlite: DatabaseSync): void {
  const row = sqlite.prepare("PRAGMA user_version").get();
  const currentVersion = Number(row?.user_version ?? 0);

  for (const migration of migrations) {
    if (migration.version <= currentVersion) continue;

    sqlite.exec("BEGIN");
    try {
      sqlite.exec(migration.sql);
      // user_version only accepts a literal, not a bound parameter.
      sqlite.exec(`PRAGMA user_version = ${migration.version}`);
      sqlite.exec("COMMIT");
    } catch (error) {
      sqlite.exec("ROLLBACK");
      throw new Error(
        `Failed to apply migration ${migration.version} (${migration.name})`,
        { cause: error },
      );
    }
  }
}
