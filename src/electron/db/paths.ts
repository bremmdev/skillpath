import os from "node:os";
import path from "node:path";

// Must match package.json "name". Electron derives userData from app.getName(),
// which in dev resolves to the package.json name.
export const APP_NAME = "skillpath";

// The DB's location under userData, kept here so ./index.ts (Electron) and the
// CLI helpers below resolve the same file from a single definition.
const DB_SUBPATH = ["database", "skillpath.db"] as const;

/** The DB file path, given an already-resolved userData directory. */
export function databaseFileFrom(userDataDir: string): string {
  return path.join(userDataDir, ...DB_SUBPATH);
}

/**
 * Replicates Electron's `app.getPath("userData")` (appData + app name) without
 * importing electron, so CLI scripts (e.g. seeding) can locate the same DB the
 * app uses. Keep in sync with how ./index.ts resolves userData.
 */
export function userDataDir(): string {
  const appData =
    process.platform === "win32"
      ? (process.env.APPDATA ?? path.join(os.homedir(), "AppData", "Roaming"))
      : process.platform === "darwin"
        ? path.join(os.homedir(), "Library", "Application Support")
        : (process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), ".config"));

  return path.join(appData, APP_NAME);
}

/** The DB file path resolved outside Electron (for CLI scripts). */
export function databaseFile(): string {
  return databaseFileFrom(userDataDir());
}
