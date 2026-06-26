import { Migration } from "./migrations.js";

/**
 * Collapses string literals and strips comments so keyword checks below can't be
 * fooled by a transaction keyword that merely appears inside a quoted string
 * (e.g. an error message) or a comment. String literals are collapsed first —
 * handling SQLite's `''` escape — so a stray `--` inside a string doesn't get
 * misread as the start of a line comment.
 */
const scrubSql = (sql: string): string =>
  sql
    .replace(/'(?:[^']|'')*'/g, "''") // collapse single-quoted string literals
    .replace(/--[^\n]*/g, "") // line comments
    .replace(/\/\*[\s\S]*?\*\//g, ""); // block comments

/**
 * Validates the migration list at startup, failing fast (before any SQL runs) on
 * authoring mistakes that the runner in ./index.ts can't recover from.
 *
 * The runner applies migrations in array order, skips any whose version is <= the
 * stored `user_version`, wraps each one in its own `BEGIN IMMEDIATE`/`COMMIT`, and
 * owns `user_version` itself. These invariants encode the assumptions that makes
 * safe: versions are positive, contiguous, sorted, start at 1, and the SQL neither
 * manages transactions nor touches `user_version`.
 */
export const validateMigrations = (migrations: Migration[]): void => {
  if (!Array.isArray(migrations) || migrations.length === 0) {
    throw new Error("validateMigrations: migration list is empty");
  }

  const seenVersions = new Set<number>();
  const seenNames = new Set<string>();

  for (const { version, name, sql } of migrations) {
    // Versions must be positive integers
    if (!Number.isInteger(version) || version < 1) {
      throw new Error(
        `Migration version must be a positive integer, got ${JSON.stringify(version)}`,
      );
    }
    if (seenVersions.has(version)) {
      throw new Error(`Duplicate migration version ${version}`);
    }
    seenVersions.add(version);

    // A non-empty name keeps the runner's error/log output meaningful; uniqueness
    // avoids two migrations being indistinguishable in those messages.
    if (typeof name !== "string" || name.trim() === "") {
      throw new Error(`Migration ${version} must have a non-empty name`);
    }
    if (seenNames.has(name)) {
      throw new Error(
        `Duplicate migration name "${name}" (version ${version})`,
      );
    }
    seenNames.add(name);

    if (typeof sql !== "string" || sql.trim() === "") {
      throw new Error(`Migration ${version} (${name}) has empty SQL`);
    }

    const scrubbed = scrubSql(sql);

    // The runner wraps each migration in BEGIN IMMEDIATE/COMMIT, and SQLite has no
    // nested transactions — so the SQL must not open/close one itself. We match
    // transaction-control statements specifically (a BEGIN/ROLLBACK terminated by
    // a `;`, optionally with a transaction qualifier) so the BEGIN...END bodies of
    // CREATE TRIGGER are not flagged. `END;` alone closes a trigger body, hence we
    // only catch the transaction form `END TRANSACTION`.
    if (
      /\bBEGIN\b(?:\s+(?:DEFERRED|IMMEDIATE|EXCLUSIVE))?(?:\s+TRANSACTION)?\s*;/i.test(
        scrubbed,
      )
    ) {
      throw new Error(
        `Migration ${version} (${name}) contains its own BEGIN — the runner manages transactions`,
      );
    }
    if (
      /\bCOMMIT\b/i.test(scrubbed) ||
      /\bEND\s+TRANSACTION\b/i.test(scrubbed)
    ) {
      throw new Error(
        `Migration ${version} (${name}) contains its own COMMIT/END TRANSACTION — the runner manages transactions`,
      );
    }
    if (/\bROLLBACK(?:\s+TRANSACTION)?\s*;/i.test(scrubbed)) {
      throw new Error(
        `Migration ${version} (${name}) contains its own ROLLBACK — the runner manages transactions`,
      );
    }
    if (/\b(?:SAVEPOINT|RELEASE)\b/i.test(scrubbed)) {
      throw new Error(
        `Migration ${version} (${name}) uses SAVEPOINT/RELEASE — the runner manages transactions`,
      );
    }

    // The runner sets user_version after each migration; a migration that sets it
    // too would desync the runner's bookkeeping and re-run or skip migrations.
    if (/PRAGMA\s+user_version/i.test(scrubbed)) {
      throw new Error(
        `Migration ${version} (${name}) sets PRAGMA user_version, which the runner owns`,
      );
    }
  }

  // Must be sorted ascending, start at 1, and have no gaps — the runner applies
  // entries in array order and skips version <= current, so an out-of-order or
  // gapped list would silently skip migrations. Requiring versions[i] === i + 1
  // enforces all three at once.
  migrations.forEach(({ version }, i) => {
    if (version !== i + 1) {
      throw new Error(
        `Migrations must be sorted and contiguous starting at 1: ` +
          `expected version ${i + 1} at index ${i}, got ${version}`,
      );
    }
  });
};
