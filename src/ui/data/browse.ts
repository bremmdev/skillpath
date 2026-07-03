/**
 * Mock data for the /browse explorer.
 *
 * Mirrors the domain model (see src/electron/db/migrations.ts):
 *   category → technology (nestable via a parent) → concept
 * plus the fallback where a concept links directly to a category.
 *
 * Categories match the ones seeded in src/electron/db/seed.ts; the technologies
 * and concepts are illustrative. Once /browse is wired to the DB, these shapes
 * can be produced by a query while the components keep consuming them unchanged.
 */

import type {
	ConceptStatus,
	SkillTreeCategory,
	SkillTreeConcept,
	SkillTreeTechnology,
} from "#/electron/db/types";

// The tree shape is produced by getSkillTree() in the main process and arrives
// over IPC (see ui/lib/query.ts). These aliases keep the browse components'
// vocabulary while pointing at the single source-of-truth types.
export type { ConceptStatus };
export type BrowseConcept = SkillTreeConcept;
export type BrowseTechnology = SkillTreeTechnology;
export type BrowseCategory = SkillTreeCategory;

// --- status presentation ----------------------------------------------------

/** Progression order, used for the status filter chips. */
export const conceptStatuses: ConceptStatus[] = [
	"discovered",
	"learning",
	"learned",
	"mastered",
];

export const statusMeta: Record<
	ConceptStatus,
	{ label: string; dot: string; text: string }
> = {
	discovered: {
		label: "Discovered",
		dot: "bg-muted-foreground/40",
		text: "text-muted-foreground",
	},
	learning: { label: "Learning", dot: "bg-chart-4", text: "text-chart-4" },
	learned: { label: "Learned", dot: "bg-chart-2", text: "text-chart-2" },
	mastered: { label: "Mastered", dot: "bg-chart-1", text: "text-chart-1" },
};

// --- filtering --------------------------------------------------------------

export type BrowseFilters = {
	/** Free-text match against concept names (and category/technology names). */
	query: string;
	/** Active status filters; empty means "all statuses". */
	statuses: ConceptStatus[];
	/** Minimum importance; 1 means "any". */
	minImportance: number;
};

export function hasActiveFilters(filters: BrowseFilters): boolean {
	return (
		filters.query.trim() !== "" ||
		filters.statuses.length > 0 ||
		filters.minImportance > 1
	);
}

/**
 * A concept passes when it clears the status/importance filters and either the
 * query is empty, an ancestor's name already matched it (`querySatisfied`), or
 * the concept's own name matches.
 */
function conceptPasses(
	concept: BrowseConcept,
	filters: BrowseFilters,
	querySatisfied: boolean,
): boolean {
	const q = filters.query.trim().toLowerCase();
	if (!querySatisfied && q !== "" && !concept.name.toLowerCase().includes(q)) {
		return false;
	}
	if (
		filters.statuses.length > 0 &&
		!filters.statuses.includes(concept.status)
	) {
		return false;
	}
	return concept.importance >= filters.minImportance;
}

function filterTechnology(
	tech: BrowseTechnology,
	filters: BrowseFilters,
	ancestorMatch: boolean,
): BrowseTechnology | null {
	const q = filters.query.trim().toLowerCase();
	const selfMatch =
		ancestorMatch || (q !== "" && tech.name.toLowerCase().includes(q));

	const children = (tech.children ?? [])
		.map((child) => filterTechnology(child, filters, selfMatch))
		.filter((child): child is BrowseTechnology => child !== null);
	const concepts = tech.concepts.filter((c) =>
		conceptPasses(c, filters, selfMatch),
	);

	// Keep a technology whose own name matched (or whose ancestor matched) even
	// when it has no concepts yet; otherwise only keep it if something under it
	// survived. Without this, technologies without logged concepts would vanish.
	if (!selfMatch && children.length === 0 && concepts.length === 0) return null;
	return {
		...tech,
		concepts,
		children: children.length > 0 ? children : undefined,
	};
}

function filterCategory(
	category: BrowseCategory,
	filters: BrowseFilters,
): BrowseCategory | null {
	const q = filters.query.trim().toLowerCase();
	const selfMatch = q !== "" && category.name.toLowerCase().includes(q);

	const technologies = category.technologies
		.map((tech) => filterTechnology(tech, filters, selfMatch))
		.filter((tech): tech is BrowseTechnology => tech !== null);
	const concepts = category.concepts.filter((c) =>
		conceptPasses(c, filters, selfMatch),
	);

	if (!selfMatch && technologies.length === 0 && concepts.length === 0) {
		return null;
	}
	return { ...category, technologies, concepts };
}

export function filterTree(
	tree: BrowseCategory[],
	filters: BrowseFilters,
): BrowseCategory[] {
	// With no active filters, show the whole tree — including categories and
	// technologies that have no concepts logged yet. Pruning empty branches only
	// makes sense once the user is actually narrowing results.
	if (!hasActiveFilters(filters)) return tree;
	return tree
		.map((category) => filterCategory(category, filters))
		.filter((category): category is BrowseCategory => category !== null);
}

// --- counts -----------------------------------------------------------------

export function countTechnologyConcepts(tech: BrowseTechnology): number {
	return (
		tech.concepts.length +
		(tech.children ?? []).reduce(
			(n, child) => n + countTechnologyConcepts(child),
			0,
		)
	);
}

export function countConcepts(category: BrowseCategory): number {
	return (
		category.concepts.length +
		category.technologies.reduce(
			(n, tech) => n + countTechnologyConcepts(tech),
			0,
		)
	);
}
