import { DatabaseSync } from "node:sqlite";
import { app } from "electron";
import { openDatabase, closeConnection } from "./open.js";
import { databaseFileFrom } from "./paths.js";

let db: DatabaseSync | undefined;

/**
 * Opens (once) the app's SQLite database and returns the cached singleton handle.
 *
 * Must be called after the Electron app is ready, since it resolves the file
 * location via `app.getPath("userData")`. The actual open + migrations live in
 * ./open.ts so the same logic can run outside Electron (see ./seed.ts).
 */
export function getDatabase(): DatabaseSync {
  if (db) return db;

  if (!app.isReady()) {
    throw new Error("getDatabase() must be called after Electron app is ready");
  }

  db = openDatabase(databaseFileFrom(app.getPath("userData")));
  return db;
}

export function closeDatabase(): void {
  if (!db) {
    return;
  }

  closeConnection(db);
  db = undefined;
}
