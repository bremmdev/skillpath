// Schema migrations applied in order by the runner in ./index.ts.
//
// The runner tracks the highest applied `version` via `PRAGMA user_version`,
// so each migration runs exactly once. To evolve the schema, append a new
// entry with the next version number and its SQL — never edit a shipped one.
//
// The DDL is embedded as strings (rather than .sql files) so it compiles into
// dist-electron and ships with the packaged app, with no file-path resolution
// or electron-builder `files` config needed at runtime.

/** SCHEMA RULES
 *  1. A "thing" is either a category or a technology, never both, so they live in separate tables
 *  2. Categories are broad areas of knowledge, and technologies are specific tools, services, or platforms within a category
 *  3. Categories do not nest
 *  4. Technologies can be linked to multiple categories (junction table) and can nest via exactly one optional parent
 *     technology (e.g. Azure Functions -> Azure), stored as a self-referencing column on the technology table
 *  5. Concepts are the things you've actually learned; they are primarily linked to technologies but can also be linked to categories as a fallback if they don't fit any technology.
 *     A concept can only be linked to one category, and one technology, not both. This is enforced by the database triggers.
 *  6. Concept categories are inferred from the technologies they are linked to, but can be overridden by the user
 *  7. Minimum-cardinality ("at least one") rules are NOT enforced by the schema — SQLite can't express them across a
 *     junction (a row legitimately has zero links at insert time, and CHECK can't span tables). They are enforced in
 *     the repository/service layer, inside the insert transaction:
 *       - every technology should reach a category: directly via technology_category, or transitively through a parent
 *       - every concept should have at least one link (a technology or a category)
 *     The DB only guarantees which links are *valid* (foreign keys) and that a concept never links to both (triggers).
 *  8. The concept_status_event table is used to track the history of concept status changes, which is used to answer the time-based questions
 *     ("learned recently", "improving areas", "profile over time").
 *     The initial status is recorded at creation (old_status NULL).
 *     Every real status change is recorded.
 */

export interface Migration {
  version: number;
  name: string;
  sql: string;
}

export const migrations: Migration[] = [
  {
    version: 1,
    name: "init",
    sql: /* sql */ `
      CREATE TABLE category (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        UNIQUE (slug),
        CHECK (slug GLOB '[a-z0-9]*' AND slug NOT GLOB '*[^a-z0-9-]*')
      );

      CREATE TABLE technology (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        description TEXT,
        parent_technology_id INTEGER REFERENCES technology(id) ON DELETE SET NULL,
        importance INTEGER NOT NULL DEFAULT 2 CHECK (importance BETWEEN 1 AND 3),
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        UNIQUE (slug),
        CHECK (slug GLOB '[a-z0-9]*' AND slug NOT GLOB '*[^a-z0-9-]*'),
        CHECK (parent_technology_id IS NULL OR parent_technology_id <> id)
      );
      CREATE INDEX idx_technology_parent ON technology (parent_technology_id);

      CREATE TABLE concept (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'discovered' CHECK (status IN ('learned', 'learning', 'discovered')),
        importance INTEGER NOT NULL DEFAULT 2 CHECK (importance BETWEEN 1 AND 3),
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        UNIQUE (slug),
        CHECK (slug GLOB '[a-z0-9]*' AND slug NOT GLOB '*[^a-z0-9-]*')
      );

      CREATE TABLE technology_category (
        technology_id INTEGER NOT NULL REFERENCES technology(id) ON DELETE CASCADE,
        category_id INTEGER NOT NULL REFERENCES category(id) ON DELETE CASCADE,
        PRIMARY KEY (technology_id, category_id)
      );
      CREATE INDEX idx_technology_category_category ON technology_category (category_id);

      CREATE TABLE concept_technology (
        concept_id INTEGER NOT NULL REFERENCES concept(id) ON DELETE CASCADE,
        technology_id INTEGER NOT NULL REFERENCES technology(id) ON DELETE CASCADE,
        PRIMARY KEY (concept_id, technology_id)
      );
      CREATE INDEX idx_concept_technology_technology ON concept_technology (technology_id);

      CREATE TABLE concept_category (
        concept_id INTEGER NOT NULL REFERENCES concept(id) ON DELETE CASCADE,
        category_id INTEGER NOT NULL REFERENCES category(id) ON DELETE CASCADE,
        PRIMARY KEY (concept_id, category_id)
      );
      CREATE INDEX idx_concept_category_category ON concept_category (category_id);

      CREATE TABLE concept_status_event (
        id INTEGER PRIMARY KEY,
        concept_id INTEGER NOT NULL REFERENCES concept(id) ON DELETE CASCADE,
        old_status TEXT,
        new_status TEXT NOT NULL,
        changed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );
      CREATE INDEX idx_concept_status_event_concept ON concept_status_event (concept_id);
      CREATE INDEX idx_concept_status_event_changed ON concept_status_event (changed_at);

      CREATE TRIGGER trg_concept_technology_excl_category
      BEFORE INSERT ON concept_technology
      FOR EACH ROW
      WHEN EXISTS (SELECT 1 FROM concept_category WHERE concept_id = NEW.concept_id)
      BEGIN
        SELECT RAISE(ABORT, 'concept has a direct category link; cannot also link to a technology');
      END;

      CREATE TRIGGER trg_concept_category_excl_technology
      BEFORE INSERT ON concept_category
      FOR EACH ROW
      WHEN EXISTS (SELECT 1 FROM concept_technology WHERE concept_id = NEW.concept_id)
      BEGIN
        SELECT RAISE(ABORT, 'concept has a technology link; cannot also link directly to a category');
      END;

      CREATE TRIGGER trg_concept_technology_excl_category_upd
      BEFORE UPDATE OF concept_id ON concept_technology
      FOR EACH ROW
      WHEN EXISTS (SELECT 1 FROM concept_category WHERE concept_id = NEW.concept_id)
      BEGIN
        SELECT RAISE(ABORT, 'concept has a direct category link; cannot also link to a technology');
      END;

      CREATE TRIGGER trg_concept_category_excl_technology_upd
      BEFORE UPDATE OF concept_id ON concept_category
      FOR EACH ROW
      WHEN EXISTS (SELECT 1 FROM concept_technology WHERE concept_id = NEW.concept_id)
      BEGIN
        SELECT RAISE(ABORT, 'concept has a technology link; cannot also link directly to a category');
      END;

      -- Record the initial status when a concept is created (old_status NULL).
      CREATE TRIGGER trg_concept_status_event_insert
      AFTER INSERT ON concept
      FOR EACH ROW
      BEGIN
        INSERT INTO concept_status_event (concept_id, old_status, new_status)
        VALUES (NEW.id, NULL, NEW.status);
      END;

      -- Record every real status change.
      CREATE TRIGGER trg_concept_status_event_update
      AFTER UPDATE OF status ON concept
      FOR EACH ROW
      WHEN NEW.status <> OLD.status
      BEGIN
        INSERT INTO concept_status_event (concept_id, old_status, new_status)
        VALUES (NEW.id, OLD.status, NEW.status);
      END;

      CREATE TRIGGER trg_category_updated_at
      AFTER UPDATE ON category
      FOR EACH ROW
      WHEN NEW.updated_at = OLD.updated_at
      BEGIN
        UPDATE category SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = OLD.id;
      END;

      CREATE TRIGGER trg_technology_updated_at
      AFTER UPDATE ON technology
      FOR EACH ROW
      WHEN NEW.updated_at = OLD.updated_at
      BEGIN
        UPDATE technology SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = OLD.id;
      END;

      CREATE TRIGGER trg_concept_updated_at
      AFTER UPDATE ON concept
      FOR EACH ROW
      WHEN NEW.updated_at = OLD.updated_at
      BEGIN
        UPDATE concept SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = OLD.id;
      END;
    `,
  },
];
