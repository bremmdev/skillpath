import type { DatabaseSync } from "node:sqlite";
import { formatSlug } from "../utils/formatters.js";
import { getDatabase } from "./index.js";
import type {
	Concept,
	CreateConceptInput,
	NewTechnologyInput,
} from "./types.js";

/**
 * Inserts a technology created on the fly from the log-concept form, recursing
 * once when its parent is itself new. Opens no transaction of its own — the
 * caller (createConcept) owns it. A root technology gets a direct
 * technology_category link; a child reaches a category through its parent
 * (schema rule 7 in ./migrations.ts). Returns the new technology's id.
 */
function insertTechnology(db: DatabaseSync, input: NewTechnologyInput): number {
	const name = input.name.trim();
	if (name === "") {
		throw new Error("Technology name is required");
	}
	const slug = formatSlug(name);
	if (slug === "") {
		throw new Error(
			"Technology name must contain at least one letter or number",
		);
	}

	// A brand-new parent is inserted before the duplicate check below so that
	// giving the parent and the child the same name surfaces as a friendly
	// duplicate error instead of a raw UNIQUE violation.
	const parent = input.parent;
	const parentTechnologyId =
		parent.type === "technology"
			? parent.id
			: parent.type === "newTechnology"
				? insertTechnology(db, {
						name: parent.name,
						parent: { type: "category", id: parent.categoryId },
					})
				: null;

	if (db.prepare("SELECT 1 FROM technology WHERE slug = ?").get(slug)) {
		throw new Error(`A technology named "${name}" already exists`);
	}

	const { lastInsertRowid } = db
		.prepare(
			"INSERT INTO technology (name, slug, parent_technology_id) VALUES (?, ?, ?)",
		)
		.run(name, slug, parentTechnologyId);
	const technologyId = Number(lastInsertRowid);

	if (parent.type === "category") {
		db.prepare(
			"INSERT INTO technology_category (technology_id, category_id) VALUES (?, ?)",
		).run(technologyId, parent.id);
	}

	return technologyId;
}

/**
 * Inserts a concept and its single technology/category link in one transaction,
 * so a failed link insert (bad id, exclusivity trigger) never leaves an orphaned
 * concept behind. A newTechnology link creates the technology — and, when asked,
 * its parent — inside the same transaction before linking the concept to it, so
 * a failure anywhere (e.g. a duplicate concept name) leaves no stray
 * technologies either. The initial status event is recorded by the DB trigger
 * (trg_concept_status_event_insert); status/importance fall back to the schema
 * defaults when omitted.
 *
 * Name emptiness and slug collisions get friendly errors here because they are
 * user-reachable from the log-concept form; everything else (status/importance
 * CHECKs, foreign keys) is guarded by the schema and only reachable through a
 * programming error, so those just propagate.
 */
export function createConcept(input: CreateConceptInput): Concept {
	const db = getDatabase();

	const name = input.name.trim();
	if (name === "") {
		throw new Error("Concept name is required");
	}
	const slug = formatSlug(name);
	if (slug === "") {
		throw new Error("Concept name must contain at least one letter or number");
	}
	if (db.prepare("SELECT 1 FROM concept WHERE slug = ?").get(slug)) {
		throw new Error(`A concept named "${name}" already exists`);
	}

	const description = input.description?.trim() || null;

	db.exec("BEGIN IMMEDIATE");
	try {
		// Resolve an on-the-fly technology (and possibly its new parent) into a
		// plain technology link before touching the concept tables.
		const link =
			input.link.type === "newTechnology"
				? {
						type: "technology" as const,
						id: insertTechnology(db, input.link.technology),
					}
				: input.link;

		const { lastInsertRowid } = db
			.prepare(
				"INSERT INTO concept (name, slug, description, status, importance) VALUES (?, ?, ?, ?, ?)",
			)
			.run(
				name,
				slug,
				description,
				input.status ?? "discovered",
				input.importance ?? 2,
			);
		const conceptId = Number(lastInsertRowid);

		const linkSql =
			link.type === "technology"
				? "INSERT INTO concept_technology (concept_id, technology_id) VALUES (?, ?)"
				: "INSERT INTO concept_category (concept_id, category_id) VALUES (?, ?)";
		db.prepare(linkSql).run(conceptId, link.id);

		db.exec("COMMIT");

		return db
			.prepare("SELECT * FROM concept WHERE id = ?")
			.get(conceptId) as Concept;
	} catch (error) {
		db.exec("ROLLBACK");
		throw error;
	}
}
