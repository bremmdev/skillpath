import { formatSlug } from "../utils/formatters.js";
import { getDatabase } from "./index.js";
import type { Concept, CreateConceptInput } from "./types.js";

/**
 * Inserts a concept and its single technology/category link in one transaction,
 * so a failed link insert (bad id, exclusivity trigger) never leaves an orphaned
 * concept behind. The initial status event is recorded by the DB trigger
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
			input.link.type === "technology"
				? "INSERT INTO concept_technology (concept_id, technology_id) VALUES (?, ?)"
				: "INSERT INTO concept_category (concept_id, category_id) VALUES (?, ?)";
		db.prepare(linkSql).run(conceptId, input.link.id);

		db.exec("COMMIT");

		return db
			.prepare("SELECT * FROM concept WHERE id = ?")
			.get(conceptId) as Concept;
	} catch (error) {
		db.exec("ROLLBACK");
		throw error;
	}
}
