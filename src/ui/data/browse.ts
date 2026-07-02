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

import type { ConceptStatus } from "#/electron/db/types";

// Re-exported so browse components have a single import source for the domain
// status union alongside the browse-specific shapes.
export type { ConceptStatus };

export type BrowseConcept = {
	id: string;
	name: string;
	slug: string;
	status: ConceptStatus;
	/** 1–5, matching the DB `importance` column. */
	importance: number;
};

export type BrowseTechnology = {
	id: string;
	name: string;
	slug: string;
	importance: number;
	concepts: BrowseConcept[];
	/** Nested technologies (e.g. Azure → Azure Functions). */
	children?: BrowseTechnology[];
};

export type BrowseCategory = {
	id: string;
	name: string;
	slug: string;
	importance: number;
	technologies: BrowseTechnology[];
	/** Concepts linked directly to the category (the schema's fallback path). */
	concepts: BrowseConcept[];
};

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

// --- mock tree --------------------------------------------------------------

export const skillTree: BrowseCategory[] = [
	{
		id: "cat-accessibility",
		name: "Accessibility",
		slug: "accessibility",
		importance: 3,
		technologies: [
			{
				id: "tech-aria",
				name: "ARIA",
				slug: "aria",
				importance: 4,
				concepts: [
					{
						id: "c-accessible-names",
						name: "Accessible names & roles",
						slug: "accessible-names-and-roles",
						status: "learned",
						importance: 4,
					},
					{
						id: "c-focus-management",
						name: "Focus management",
						slug: "focus-management",
						status: "learning",
						importance: 3,
					},
				],
			},
		],
		concepts: [
			{
				id: "c-color-contrast",
				name: "Color contrast ratios",
				slug: "color-contrast-ratios",
				status: "mastered",
				importance: 3,
			},
		],
	},
	{
		id: "cat-ai",
		name: "Artificial Intelligence",
		slug: "artificial-intelligence",
		importance: 5,
		technologies: [
			{
				id: "tech-openai",
				name: "OpenAI API",
				slug: "openai-api",
				importance: 5,
				concepts: [
					{
						id: "c-structured-output",
						name: "Structured output",
						slug: "structured-output",
						status: "learned",
						importance: 5,
					},
					{
						id: "c-function-calling",
						name: "Function calling",
						slug: "function-calling",
						status: "learning",
						importance: 4,
					},
				],
			},
			{
				id: "tech-langchain",
				name: "LangChain",
				slug: "langchain",
				importance: 3,
				concepts: [
					{
						id: "c-rag",
						name: "Retrieval-augmented generation",
						slug: "retrieval-augmented-generation",
						status: "discovered",
						importance: 4,
					},
				],
			},
		],
		concepts: [],
	},
	{
		id: "cat-cloud",
		name: "Cloud",
		slug: "cloud",
		importance: 5,
		technologies: [
			{
				id: "tech-azure",
				name: "Azure",
				slug: "azure",
				importance: 5,
				concepts: [],
				children: [
					{
						id: "tech-azure-functions",
						name: "Azure Functions",
						slug: "azure-functions",
						importance: 4,
						concepts: [
							{
								id: "c-vnet-integration",
								name: "VNET integration",
								slug: "vnet-integration",
								status: "learning",
								importance: 4,
							},
							{
								id: "c-durable-functions",
								name: "Durable functions",
								slug: "durable-functions",
								status: "discovered",
								importance: 3,
							},
						],
					},
				],
			},
			{
				id: "tech-aws",
				name: "AWS",
				slug: "aws",
				importance: 4,
				concepts: [
					{
						id: "c-s3-lifecycle",
						name: "S3 lifecycle policies",
						slug: "s3-lifecycle-policies",
						status: "learned",
						importance: 3,
					},
				],
			},
		],
		concepts: [],
	},
	{
		id: "cat-devops",
		name: "DevOps",
		slug: "devops",
		importance: 4,
		technologies: [
			{
				id: "tech-docker",
				name: "Docker",
				slug: "docker",
				importance: 5,
				concepts: [
					{
						id: "c-multi-stage-builds",
						name: "Multi-stage builds",
						slug: "multi-stage-builds",
						status: "mastered",
						importance: 4,
					},
					{
						id: "c-layer-caching",
						name: "Layer caching",
						slug: "layer-caching",
						status: "learned",
						importance: 3,
					},
				],
			},
			{
				id: "tech-github-actions",
				name: "GitHub Actions",
				slug: "github-actions",
				importance: 4,
				concepts: [
					{
						id: "c-reusable-workflows",
						name: "Reusable workflows",
						slug: "reusable-workflows",
						status: "learning",
						importance: 3,
					},
				],
			},
		],
		concepts: [],
	},
	{
		id: "cat-databases",
		name: "Databases",
		slug: "databases",
		importance: 5,
		technologies: [
			{
				id: "tech-postgresql",
				name: "PostgreSQL",
				slug: "postgresql",
				importance: 5,
				concepts: [
					{
						id: "c-indexing-strategies",
						name: "Indexing strategies",
						slug: "indexing-strategies",
						status: "learned",
						importance: 5,
					},
					{
						id: "c-row-level-security",
						name: "Row-level security",
						slug: "row-level-security",
						status: "discovered",
						importance: 3,
					},
				],
			},
			{
				id: "tech-sqlite",
				name: "SQLite",
				slug: "sqlite",
				importance: 3,
				concepts: [
					{
						id: "c-wal-mode",
						name: "WAL mode",
						slug: "wal-mode",
						status: "learning",
						importance: 3,
					},
				],
			},
		],
		concepts: [],
	},
	{
		id: "cat-languages",
		name: "Programming Languages",
		slug: "programming-languages",
		importance: 5,
		technologies: [
			{
				id: "tech-typescript",
				name: "TypeScript",
				slug: "typescript",
				importance: 5,
				concepts: [
					{
						id: "c-discriminated-unions",
						name: "Discriminated unions",
						slug: "discriminated-unions",
						status: "mastered",
						importance: 4,
					},
					{
						id: "c-conditional-types",
						name: "Conditional types",
						slug: "conditional-types",
						status: "learning",
						importance: 3,
					},
				],
			},
			{
				id: "tech-rust",
				name: "Rust",
				slug: "rust",
				importance: 3,
				concepts: [
					{
						id: "c-ownership-borrowing",
						name: "Ownership & borrowing",
						slug: "ownership-and-borrowing",
						status: "discovered",
						importance: 4,
					},
				],
			},
		],
		concepts: [],
	},
	{
		id: "cat-infrastructure",
		name: "Infrastructure",
		slug: "infrastructure",
		importance: 4,
		technologies: [
			{
				id: "tech-terraform",
				name: "Terraform",
				slug: "terraform",
				importance: 4,
				concepts: [
					{
						id: "c-remote-state",
						name: "Remote state",
						slug: "remote-state",
						status: "learning",
						importance: 4,
					},
					{
						id: "c-tf-modules",
						name: "Modules",
						slug: "modules",
						status: "learned",
						importance: 3,
					},
				],
			},
		],
		concepts: [],
	},
	{
		id: "cat-networking",
		name: "Networking",
		slug: "networking",
		importance: 3,
		// No technologies logged yet — concepts attach directly to the category.
		technologies: [],
		concepts: [
			{
				id: "c-tls-handshake",
				name: "TLS handshake",
				slug: "tls-handshake",
				status: "learned",
				importance: 4,
			},
			{
				id: "c-dns-resolution",
				name: "DNS resolution",
				slug: "dns-resolution",
				status: "mastered",
				importance: 3,
			},
		],
	},
	{
		id: "cat-security",
		name: "Security",
		slug: "security",
		importance: 5,
		technologies: [
			{
				id: "tech-oauth",
				name: "OAuth 2.0",
				slug: "oauth-2",
				importance: 5,
				concepts: [
					{
						id: "c-pkce-flow",
						name: "PKCE flow",
						slug: "pkce-flow",
						status: "learning",
						importance: 4,
					},
					{
						id: "c-refresh-token-rotation",
						name: "Refresh token rotation",
						slug: "refresh-token-rotation",
						status: "discovered",
						importance: 4,
					},
				],
			},
		],
		concepts: [],
	},
];

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

	if (children.length === 0 && concepts.length === 0) return null;
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

	if (technologies.length === 0 && concepts.length === 0) return null;
	return { ...category, technologies, concepts };
}

export function filterTree(
	tree: BrowseCategory[],
	filters: BrowseFilters,
): BrowseCategory[] {
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
