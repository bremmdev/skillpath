import { formatSlug } from "../utils/formatters.js";
import { getDatabase } from "./index.js";
import type { Category, CreateCategoryInput } from "./types.js";

export function getCategories(): Category[] {
	const db = getDatabase();
	return db.prepare("SELECT * FROM category").all() as Category[];
}

/**
 * Inserts a new category from the add-category dialog. Name emptiness and slug
 * collisions get friendly errors because they are user-reachable from the form;
 * everything else (the slug CHECK) is guarded by formatSlug. Only name and its
 * derived slug are stored — the category table has no other user columns.
 * Returns the created row.
 */
export function createCategory(input: CreateCategoryInput): Category {
	const db = getDatabase();

	const name = input.name.trim();
	if (name === "") {
		throw new Error("Category name is required");
	}
	const slug = formatSlug(name);
	if (slug === "") {
		throw new Error(
			"Category name must contain at least one letter or number",
		);
	}
	if (db.prepare("SELECT 1 FROM category WHERE slug = ?").get(slug)) {
		throw new Error(`A category named "${name}" already exists`);
	}

	const { lastInsertRowid } = db
		.prepare("INSERT INTO category (name, slug) VALUES (?, ?)")
		.run(name, slug);

	return db
		.prepare("SELECT * FROM category WHERE id = ?")
		.get(Number(lastInsertRowid)) as Category;
}
