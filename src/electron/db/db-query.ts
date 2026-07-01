import { getDatabase } from "./index.js";
import type { Category } from "./types.js";

export function getCategories(): Category[] {
  const db = getDatabase();
  return db.prepare("SELECT * FROM category").all() as Category[];
}
