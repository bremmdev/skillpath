import type { DatabaseSync } from "node:sqlite";
import { formatSlug } from "../../utils/formatters.js";
import { closeConnection, openDatabase } from "../open.js";
import { databaseFile } from "../paths.js";
import { categories, technologies } from "./seed-data.js";

function seedCategories(db: DatabaseSync) {
  const insert = db.prepare(
    "INSERT OR IGNORE INTO category (name, slug) VALUES (?, ?)",
  );
  for (const category of categories) {
    insert.run(category, formatSlug(category));
  }
}

function seedTechnologies(db: DatabaseSync) {
  // Categories are seeded first, so resolve their ids up front for linking.
  const categoryIdBySlug = new Map<string, number>();
  for (const row of db.prepare("SELECT id, slug FROM category").all() as {
    id: number;
    slug: string;
  }[]) {
    categoryIdBySlug.set(row.slug, row.id);
  }

  const insertTech = db.prepare(
    "INSERT OR IGNORE INTO technology (name, slug, description, importance) VALUES (?, ?, ?, ?)",
  );
  const selectTechId = db.prepare("SELECT id FROM technology WHERE slug = ?");
  const setParent = db.prepare(
    "UPDATE technology SET parent_technology_id = ? WHERE id = ?",
  );
  const linkCategory = db.prepare(
    "INSERT OR IGNORE INTO technology_category (technology_id, category_id) VALUES (?, ?)",
  );

  // name -> id, so a technology can reference a parent defined anywhere in the list.
  const techIdByName = new Map<string, number>();

  // Pass 1: insert every technology row (importance falls back to the schema default of 3).
  for (const tech of technologies) {
    const slug = formatSlug(tech.name);
    insertTech.run(
      tech.name,
      slug,
      tech.description ?? null,
      tech.importance ?? 3,
    );
    const row = selectTechId.get(slug) as { id: number };
    techIdByName.set(tech.name, row.id);
  }

  // Pass 2: wire parent and category links now that every technology has an id.
  for (const tech of technologies) {
    const techId = techIdByName.get(tech.name)!;

    if (tech.parentTechnology) {
      const parentId = techIdByName.get(tech.parentTechnology);
      if (parentId === undefined) {
        throw new Error(
          `Technology "${tech.name}" references unknown parent "${tech.parentTechnology}"`,
        );
      }
      setParent.run(parentId, techId);
    }

    if (tech.category) {
      const categoryId = categoryIdBySlug.get(formatSlug(tech.category));
      if (categoryId === undefined) {
        throw new Error(
          `Technology "${tech.name}" references unknown category "${tech.category}"`,
        );
      }
      linkCategory.run(techId, categoryId);
    }

    // A technology must reach a category — directly, or transitively via a parent.
    if (!tech.parentTechnology && !tech.category) {
      throw new Error(
        `Technology "${tech.name}" has neither a category nor a parent technology`,
      );
    }
  }
}

function seedDatabase() {
  // Resolves the same file the Electron app uses, then opens it directly (the
  // app's getDatabase() can't run here — it depends on electron's app module).
  const db = openDatabase(databaseFile());

  try {
    // One transaction so a bad reference (unknown parent/category) rolls the
    // whole seed back instead of leaving the tables half-populated.
    db.exec("BEGIN");
    try {
      seedCategories(db);
      seedTechnologies(db);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  } finally {
    closeConnection(db);
  }
}

seedDatabase();
