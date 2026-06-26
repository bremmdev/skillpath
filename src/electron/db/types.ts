// Row types for the SQLite tables. Hand-written (no ORM); keep these in sync
// with the DDL in ./migrations.ts. Field names match the snake_case columns.
//
// A "thing" is either a category or a technology (separate tables). Concepts are
// the things you've actually learned. Categories/technologies, technologies/parent
// technologies, and concepts/technologies-or-categories are linked via junction
// tables. concept_status_event tracks the history of concept status changes.

export type ConceptStatus = "learned" | "learning" | "mastered" | "discovered";

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
