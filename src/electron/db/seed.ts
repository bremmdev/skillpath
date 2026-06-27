import { formatSlug } from "../utils/formatters.js";
import { closeConnection, openDatabase } from "./open.js";
import { databaseFile } from "./paths.js";

const categories = [
  "Accessibility",
  "Artificial Intelligence",
  "Cloud",
  "DevOps",
  "Databases",
  "Programming Languages",
  "Infrastructure",
  "Networking",
  "Security",
] as const;

function seedDatabase() {
  // Resolves the same file the Electron app uses, then opens it directly (the
  // app's getDatabase() can't run here — it depends on electron's app module).
  const db = openDatabase(databaseFile());

  try {
    for (const category of categories) {
      db.prepare(
        "INSERT OR IGNORE INTO category (name, slug) VALUES (?, ?)",
      ).run(category, formatSlug(category));
    }
  } finally {
    closeConnection(db);
  }
}

seedDatabase();
