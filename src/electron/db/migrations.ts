// Schema migrations applied in order by the runner in ./index.ts.
//
// The runner tracks the highest applied `version` via `PRAGMA user_version`,
// so each migration runs exactly once. To evolve the schema, append a new
// entry with the next version number and its SQL — never edit a shipped one.
//
// The DDL is embedded as strings (rather than .sql files) so it compiles into
// dist-electron and ships with the packaged app, with no file-path resolution
// or electron-builder `files` config needed at runtime.

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
      CREATE TABLE knowledge_nodes (
        id INTEGER PRIMARY KEY,
        type TEXT NOT NULL CHECK (type IN ('category', 'technology', 'concept')),
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'discovered' CHECK (status IN ('learned', 'learning', 'comfortable', 'mastered', 'discovered', 'needs_review')),
        importance INTEGER NOT NULL DEFAULT 3 CHECK (importance BETWEEN 1 AND 5),
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        UNIQUE (slug)
      );

      CREATE TABLE knowledge_relationships (
        id INTEGER PRIMARY KEY,
        source_node_id INTEGER NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
        target_node_id INTEGER NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
        relationship_type TEXT NOT NULL CHECK (relationship_type IN ('parent_of', 'related_to', 'prerequisite_for')),
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        CHECK (source_node_id <> target_node_id),
        UNIQUE (source_node_id, target_node_id, relationship_type)
      );

      CREATE INDEX idx_rel_source ON knowledge_relationships (source_node_id);
      CREATE INDEX idx_rel_target ON knowledge_relationships (target_node_id);

      -- Stamp updated_at on every row update. The WHEN guard skips the case
      -- where a caller set updated_at explicitly, which also prevents the
      -- trigger's own UPDATE from re-firing (if recursive_triggers is on).
      CREATE TRIGGER trg_knowledge_nodes_updated_at
      AFTER UPDATE ON knowledge_nodes
      FOR EACH ROW
      WHEN NEW.updated_at = OLD.updated_at
      BEGIN
        UPDATE knowledge_nodes
        SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE id = OLD.id;
      END;

      CREATE TRIGGER trg_knowledge_relationships_updated_at
      AFTER UPDATE ON knowledge_relationships
      FOR EACH ROW
      WHEN NEW.updated_at = OLD.updated_at
      BEGIN
        UPDATE knowledge_relationships
        SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE id = OLD.id;
      END;
    `,
  },
];
