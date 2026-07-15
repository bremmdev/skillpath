import { getDatabase } from "./index.js";
import type {
	ConceptStatus,
	ExistingConceptLink,
	SkillTreeCategory,
	SkillTreeConcept,
	SkillTreeTechnology,
} from "./types.js";

// Row projections used only while assembling the tree below.
type CategoryRow = { id: number; name: string; slug: string };
type TechnologyRow = CategoryRow & {
	description: string | null;
	importance: number;
	parent_technology_id: number | null;
};
type ConceptRow = {
	id: number;
	name: string;
	slug: string;
	description: string | null;
	status: ConceptStatus;
	importance: number;
};

/**
 * Builds the category → technology (nested by parent) → concept tree for the
 * /browse explorer.
 *
 * Placement rules, mirroring the schema (see ./migrations.ts):
 *   - A technology appears at the top level of every category it links to
 *     directly via technology_category — whether or not it has a parent.
 *   - A technology also nests under its parent, wherever that parent sits. So a
 *     technology linked to a category directly while also having a parent shows
 *     up twice: nested under its parent and at the top of that category.
 *   - Concepts hang off their technology, or off a category directly (fallback).
 * All categories are returned, even empty ones, so the explorer can show the
 * full structure before concepts are logged.
 */
export function getSkillTree(): SkillTreeCategory[] {
	const db = getDatabase();

	const categories = db
		.prepare("SELECT id, name, slug FROM category ORDER BY name")
		.all() as CategoryRow[];
	// Ordered by name so children and per-category roots come out sorted below.
	const technologies = db
		.prepare(
			"SELECT id, name, slug, description, importance, parent_technology_id FROM technology ORDER BY name",
		)
		.all() as TechnologyRow[];
	const techCategoryLinks = db
		.prepare("SELECT technology_id, category_id FROM technology_category")
		.all() as { technology_id: number; category_id: number }[];
	const concepts = db
		.prepare(
			"SELECT id, name, slug, description, status, importance FROM concept ORDER BY name",
		)
		.all() as ConceptRow[];
	const conceptTechLinks = db
		.prepare("SELECT concept_id, technology_id FROM concept_technology")
		.all() as { concept_id: number; technology_id: number }[];
	const conceptCategoryLinks = db
		.prepare("SELECT concept_id, category_id FROM concept_category")
		.all() as { concept_id: number; category_id: number }[];

	const linkByConceptId = new Map<number, ExistingConceptLink>();
	for (const { concept_id, technology_id } of conceptTechLinks) {
		linkByConceptId.set(concept_id, {
			type: "technology",
			id: technology_id,
		});
	}
	for (const { concept_id, category_id } of conceptCategoryLinks) {
		linkByConceptId.set(concept_id, { type: "category", id: category_id });
	}

	const conceptById = new Map<number, SkillTreeConcept>();
	for (const c of concepts) {
		const link = linkByConceptId.get(c.id);
		if (!link) continue;
		conceptById.set(c.id, {
			id: `concept-${c.id}`,
			name: c.name,
			slug: c.slug,
			description: c.description,
			status: c.status,
			importance: c.importance,
			link,
		});
	}

	const conceptsByTech = new Map<number, SkillTreeConcept[]>();
	for (const { concept_id, technology_id } of conceptTechLinks) {
		const concept = conceptById.get(concept_id);
		if (!concept) continue;
		const list = conceptsByTech.get(technology_id) ?? [];
		list.push(concept);
		conceptsByTech.set(technology_id, list);
	}

	const conceptsByCategory = new Map<number, SkillTreeConcept[]>();
	for (const { concept_id, category_id } of conceptCategoryLinks) {
		const concept = conceptById.get(concept_id);
		if (!concept) continue;
		const list = conceptsByCategory.get(category_id) ?? [];
		list.push(concept);
		conceptsByCategory.set(category_id, list);
	}

	// parent id -> its child technologies (name-ordered, from the query above).
	const childrenByParent = new Map<number, TechnologyRow[]>();
	for (const tech of technologies) {
		if (tech.parent_technology_id === null) continue;
		const list = childrenByParent.get(tech.parent_technology_id) ?? [];
		list.push(tech);
		childrenByParent.set(tech.parent_technology_id, list);
	}

	const categoryIdsByTech = new Map<number, number[]>();
	for (const { technology_id, category_id } of techCategoryLinks) {
		const list = categoryIdsByTech.get(technology_id) ?? [];
		list.push(category_id);
		categoryIdsByTech.set(technology_id, list);
	}

	// category id -> its top-level technologies: every technology directly linked
	// to the category (root or not, name-ordered). A non-root also stays nested
	// under its parent elsewhere in the tree.
	const topLevelByCategory = new Map<number, TechnologyRow[]>();
	for (const tech of technologies) {
		for (const categoryId of categoryIdsByTech.get(tech.id) ?? []) {
			const list = topLevelByCategory.get(categoryId) ?? [];
			list.push(tech);
			topLevelByCategory.set(categoryId, list);
		}
	}

	const buildTechnology = (tech: TechnologyRow): SkillTreeTechnology => {
		const children = (childrenByParent.get(tech.id) ?? []).map(buildTechnology);
		return {
			id: `tech-${tech.id}`,
			name: tech.name,
			slug: tech.slug,
			description: tech.description,
			importance: tech.importance,
			concepts: conceptsByTech.get(tech.id) ?? [],
			children: children.length > 0 ? children : undefined,
		};
	};

	return categories.map((category) => ({
		id: `cat-${category.id}`,
		name: category.name,
		slug: category.slug,
		technologies: (topLevelByCategory.get(category.id) ?? []).map(
			buildTechnology,
		),
		concepts: conceptsByCategory.get(category.id) ?? [],
	}));
}
