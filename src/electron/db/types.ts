// Row types for the SQLite tables. Hand-written (no ORM); keep these in sync
// with the DDL in ./migrations.ts. Field names match the snake_case columns.
//
// A "thing" is either a category or a technology (separate tables). Concepts are
// the things you've actually learned. Categories/technologies, technologies/parent
// technologies, and concepts/technologies-or-categories are linked via junction
// tables. concept_status_event tracks the history of concept status changes.

export type ConceptStatus = "learned" | "learning" | "discovered";

export type Category = {
	id: number;
	name: string;
	slug: string;
	description: string | null;
	importance: number;
	created_at: string;
	updated_at: string;
};

// id/created_at/updated_at are DB-generated; description/importance have defaults.
export type NewCategory = Omit<
	Category,
	"id" | "created_at" | "updated_at" | "description" | "importance"
> &
	Partial<Pick<Category, "description" | "importance">>;

export type Technology = {
	id: number;
	name: string;
	slug: string;
	description: string | null;
	parent_technology_id: number | null;
	importance: number;
	created_at: string;
	updated_at: string;
};

export type NewTechnology = Omit<
	Technology,
	| "id"
	| "created_at"
	| "updated_at"
	| "description"
	| "parent_technology_id"
	| "importance"
> &
	Partial<
		Pick<Technology, "description" | "parent_technology_id" | "importance">
	>;

export type Concept = {
	id: number;
	name: string;
	slug: string;
	description: string | null;
	status: ConceptStatus;
	importance: number;
	created_at: string;
	updated_at: string;
};

export type NewConcept = Omit<
	Concept,
	"id" | "created_at" | "updated_at" | "description" | "status" | "importance"
> &
	Partial<Pick<Concept, "description" | "status" | "importance">>;

// Where a technology created on the fly (while logging a concept) hangs in
// the tree. Mirrors schema rule 7 (./migrations.ts): every technology must
// reach a category, so it either nests under a parent technology — existing,
// or itself created on the fly (one level deep) — or links directly to a
// category as a root. A new parent is always a root, hence its categoryId.
export type NewTechnologyParent =
	| { type: "technology"; id: number }
	| { type: "category"; id: number }
	| { type: "newTechnology"; name: string; categoryId: number };

export type NewTechnologyInput = {
	name: string;
	parent: NewTechnologyParent;
};

// Input for createConcept() (see ./db-mutate.ts). The link is required because
// the "every concept has at least one link" rule lives in the service layer,
// not the DDL (schema rule 7 in ./migrations.ts); it is singular because a
// concept links to exactly one technology or category (rule 5, DB triggers).
// The newTechnology variant creates the technology (and optionally its parent)
// in the same transaction as the concept, then links the concept to it.
export type ConceptLink =
	| { type: "technology"; id: number }
	| { type: "category"; id: number }
	| { type: "newTechnology"; technology: NewTechnologyInput };

export type CreateConceptInput = {
	name: string;
	description?: string | null;
	status?: ConceptStatus;
	importance?: number;
	link: ConceptLink;
};

// --- junction tables --------------------------------------------------------

export type TechnologyCategory = {
	technology_id: number;
	category_id: number;
};

export type ConceptTechnology = {
	concept_id: number;
	technology_id: number;
};

export type ConceptCategory = {
	concept_id: number;
	category_id: number;
};

export type ConceptStatusEvent = {
	id: number;
	concept_id: number;
	// NULL when the row records the initial status at concept creation.
	old_status: ConceptStatus | null;
	new_status: ConceptStatus;
	changed_at: string;
};

// Rows are written automatically by the concept status triggers
// (trg_concept_status_event_insert / _update), not inserted by hand. Kept for
// completeness / read typing.
export type NewConceptStatusEvent = Omit<
	ConceptStatusEvent,
	"id" | "changed_at" | "old_status"
> &
	Partial<Pick<ConceptStatusEvent, "old_status">>;

// --- composite query shapes -------------------------------------------------

// The category → technology (nested) → concept tree assembled by
// getSkillTree() for the /browse explorer. `id` is a namespaced string
// ("cat-1", "tech-3", "concept-8") because category and technology rows share
// the same integer id space across their tables; namespacing keeps them unique
// as React keys and as expand/collapse handles in the tree UI.

export type SkillTreeConcept = {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	status: ConceptStatus;
	importance: number;
};

export type SkillTreeTechnology = {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	importance: number;
	concepts: SkillTreeConcept[];
	/** Nested technologies (e.g. Azure → Azure Functions). Absent when none. */
	children?: SkillTreeTechnology[];
};

export type SkillTreeCategory = {
	id: string;
	name: string;
	slug: string;
	technologies: SkillTreeTechnology[];
	/** Concepts linked directly to the category (the schema's fallback path). */
	concepts: SkillTreeConcept[];
};
