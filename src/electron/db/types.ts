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

// Input for createConcept() (see ./concepts.ts). The link is required because
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

// Input for updateConcept() (see ./concepts.ts). Identifies the concept by id
// and replaces its editable fields; the concept's technology/category link is
// not touched here (re-parenting is a separate operation). A null/absent
// description clears any existing notes.
export type UpdateConceptInput = {
  id: number;
  name: string;
  description?: string | null;
  status: ConceptStatus;
  importance: number;
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

// --- dashboard query shapes -------------------------------------------------

// Raw counts behind the home dashboard's stat cards (see getDashboardStats()).
// Presentation strings ("+3 this week", "across 8 categories") are composed in
// the UI layer from these numbers, so the backend stays free of copy.
export type DashboardStats = {
  conceptsLogged: number; /** Concepts created in the last 7 days. */
  conceptsThisWeek: number;
  technologies: number;
  /** Distinct categories that have at least one technology linked directly. */
  categoriesWithTechnologies: number;
  /** Categories that have at least one concept (directly or via a technology). */
  activeCategories: number;
  totalCategories: number;
  /** Consecutive days up to today (or yesterday) with a concept logged. */
  dayStreak: number;
  longestStreak: number;
};

export type LearningFocusRange = 30 | 90;

export type LearningFocusBucket = {
  startDate: string;
  endDate: string;
  total: number;
  added: number;
  statusChanges: number;
  categoryEvents: Record<string, number>;
};

export type LearningFocusCategory = {
  name: string;
  events: number;
  previousEvents: number;
  added: number;
  statusChanges: number;
  share: number;
  shareDelta: number | null;
};

// Aggregated concept touches behind the dashboard's learning-focus view. An
// initial status event represents a concept being added; later events represent
// status changes. Multiple events for one concept on one UTC day count once.
export type LearningFocus = {
  rangeDays: LearningFocusRange;
  totalEvents: number;
  previousTotalEvents: number;
  totalDelta: number | null;
  added: number;
  statusChanges: number;
  categories: LearningFocusCategory[];
  buckets: LearningFocusBucket[];
};

// A row in the "Recently learned" list (see getRecentlyLearnedConcepts()).
// `createdAt` is the raw ISO timestamp; the UI formats it into a relative label
// ("2h ago", "Yesterday") at render time so it never goes stale in the cache.
// `technologies` holds the concept's linked technology names (empty for a
// concept linked directly to a category); `category` is the area it strengthened
// — the direct category link, or the one its technology reaches.
export type RecentlyLearnedConcept = {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
  technologies: string[];
  category: string | null;
};
