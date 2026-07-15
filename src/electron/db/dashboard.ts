import type { DatabaseSync } from "node:sqlite";
import { getDatabase } from "./index.js";
import type {
	DashboardStats,
	LearningFocus,
	LearningFocusRange,
	RecentlyLearnedConcept,
} from "./types.js";

/**
 * Resolves every technology to the category ids it reaches, walking up the
 * parent chain (schema rule 4: a technology nests via exactly one parent) until
 * the first level that has direct technology_category links. That closest level
 * gives the most specific category for a concept — used both to attribute a
 * logged concept to an area and to count active categories below. Technologies
 * that never reach a category resolve to an empty list.
 */
function resolveTechnologyCategories(db: DatabaseSync): Map<number, number[]> {
	const technologies = db
		.prepare("SELECT id, parent_technology_id FROM technology")
		.all() as { id: number; parent_technology_id: number | null }[];
	const parentById = new Map<number, number | null>();
	for (const t of technologies) {
		parentById.set(t.id, t.parent_technology_id);
	}

	const directByTech = new Map<number, number[]>();
	const links = db
		.prepare("SELECT technology_id, category_id FROM technology_category")
		.all() as { technology_id: number; category_id: number }[];
	for (const { technology_id, category_id } of links) {
		const list = directByTech.get(technology_id) ?? [];
		list.push(category_id);
		directByTech.set(technology_id, list);
	}

	const resolved = new Map<number, number[]>();
	for (const tech of technologies) {
		let current: number | null = tech.id;
		const seen = new Set<number>();
		let categories: number[] = [];
		while (current !== null && !seen.has(current)) {
			seen.add(current);
			const direct = directByTech.get(current);
			if (direct && direct.length > 0) {
				categories = direct;
				break;
			}
			current = parentById.get(current) ?? null;
		}
		resolved.set(tech.id, categories);
	}
	return resolved;
}

/**
 * Counts and streaks behind the home dashboard's stat cards. Concept "logging"
 * is keyed off concept.created_at (when you added it), so "this week" and the
 * day streak reflect activity rather than status history. Active categories are
 * resolved from each concept's link — a direct category, or the one its
 * technology reaches (see resolveTechnologyCategories) — and unioned.
 */
export function getDashboardStats(): DashboardStats {
	const db = getDatabase();

	const count = (sql: string): number =>
		(db.prepare(sql).get() as { n: number }).n;

	const conceptsLogged = count("SELECT COUNT(*) AS n FROM concept");
	const technologies = count("SELECT COUNT(*) AS n FROM technology");
	const totalCategories = count("SELECT COUNT(*) AS n FROM category");
	const categoriesWithTechnologies = count(
		"SELECT COUNT(DISTINCT category_id) AS n FROM technology_category",
	);

	// ISO timestamps compare lexicographically (fixed format), so a string bound
	// avoids parsing created_at; both sides use SQLite's UTC 'now'.
	const conceptsThisWeek = (
		db
			.prepare(
				"SELECT COUNT(*) AS n FROM concept WHERE created_at >= strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-7 days')",
			)
			.get() as { n: number }
	).n;

	// Active categories: union of the categories every concept touches.
	const techCategories = resolveTechnologyCategories(db);
	const conceptTechLinks = db
		.prepare("SELECT technology_id FROM concept_technology")
		.all() as { technology_id: number }[];
	const conceptCatLinks = db
		.prepare("SELECT category_id FROM concept_category")
		.all() as { category_id: number }[];
	const activeCategoryIds = new Set<number>();
	for (const { category_id } of conceptCatLinks) {
		activeCategoryIds.add(category_id);
	}
	for (const { technology_id } of conceptTechLinks) {
		for (const categoryId of techCategories.get(technology_id) ?? []) {
			activeCategoryIds.add(categoryId);
		}
	}

	// Streak: distinct UTC log-days, newest first. substr avoids relying on
	// SQLite's date() parsing of the trailing 'Z'.
	const logDays = (
		db
			.prepare(
				"SELECT DISTINCT substr(created_at, 1, 10) AS d FROM concept ORDER BY d DESC",
			)
			.all() as { d: string }[]
	).map((row) => row.d);
	const today = new Date().toISOString().slice(0, 10);
	const { current, longest } = computeStreaks(logDays, today);

	return {
		conceptsLogged,
		conceptsThisWeek,
		technologies,
		categoriesWithTechnologies,
		activeCategories: activeCategoryIds.size,
		totalCategories,
		dayStreak: current,
		longestStreak: longest,
	};
}

/**
 * From a descending list of unique 'YYYY-MM-DD' log-days, returns the current
 * streak (consecutive days ending today, or yesterday so today stays "pending")
 * and the longest streak ever. Days are compared as integer day-indices.
 */
function computeStreaks(
	daysDesc: string[],
	today: string,
): { current: number; longest: number } {
	if (daysDesc.length === 0) return { current: 0, longest: 0 };

	const dayIndex = (d: string) => Date.parse(`${d}T00:00:00Z`) / 86_400_000;
	const indices = daysDesc.map(dayIndex);
	const todayIndex = dayIndex(today);

	let current = 0;
	if (indices[0] === todayIndex || indices[0] === todayIndex - 1) {
		current = 1;
		for (let i = 1; i < indices.length; i++) {
			if (indices[i] === indices[i - 1] - 1) current++;
			else break;
		}
	}

	let longest = 1;
	let run = 1;
	for (let i = 1; i < indices.length; i++) {
		run = indices[i] === indices[i - 1] - 1 ? run + 1 : 1;
		if (run > longest) longest = run;
	}

	return { current, longest };
}

type FocusTouch = {
	conceptId: number;
	changedAt: string;
	category: string;
	kind: "added" | "statusChange";
};

function resolveConceptCategoryNames(db: DatabaseSync): Map<number, string> {
	const categoryNameById = new Map<number, string>();
	for (const { id, name } of db
		.prepare("SELECT id, name FROM category")
		.all() as { id: number; name: string }[]) {
		categoryNameById.set(id, name);
	}

	const categoryIdByConcept = new Map<number, number>();
	for (const { concept_id, category_id } of db
		.prepare("SELECT concept_id, category_id FROM concept_category")
		.all() as { concept_id: number; category_id: number }[]) {
		if (!categoryIdByConcept.has(concept_id)) {
			categoryIdByConcept.set(concept_id, category_id);
		}
	}

	const techCategories = resolveTechnologyCategories(db);
	for (const { concept_id, technology_id } of db
		.prepare("SELECT concept_id, technology_id FROM concept_technology")
		.all() as { concept_id: number; technology_id: number }[]) {
		if (categoryIdByConcept.has(concept_id)) continue;
		const [categoryId] = techCategories.get(technology_id) ?? [];
		if (categoryId !== undefined) {
			categoryIdByConcept.set(concept_id, categoryId);
		}
	}

	return new Map(
		[...categoryIdByConcept].map(([conceptId, categoryId]) => [
			conceptId,
			categoryNameById.get(categoryId) ?? "Uncategorized",
		]),
	);
}

/**
 * Aggregates learning activity by category for the current range and the
 * immediately preceding range. The initial status event is the concept-add
 * event; subsequent status events are updates. Repeated changes to one concept
 * on the same UTC day are collapsed into a single touch.
 */
export function getLearningFocus(rangeDays: LearningFocusRange): LearningFocus {
	const db = getDatabase();
	const dayMs = 86_400_000;
	const now = new Date();
	const currentEnd = new Date(
		Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
	);
	const currentStart = new Date(currentEnd.getTime() - rangeDays * dayMs);
	const previousStart = new Date(currentStart.getTime() - rangeDays * dayMs);
	const currentStartIso = currentStart.toISOString();

	const rows = db
		.prepare(
			`SELECT concept_id, old_status, changed_at
			 FROM concept_status_event
			 WHERE changed_at >= ? AND changed_at < ?
			 ORDER BY changed_at ASC`,
		)
		.all(previousStart.toISOString(), currentEnd.toISOString()) as {
		concept_id: number;
		old_status: string | null;
		changed_at: string;
	}[];

	const categoryByConcept = resolveConceptCategoryNames(db);
	const touchesByConceptDay = new Map<string, FocusTouch>();
	for (const row of rows) {
		const key = `${row.concept_id}:${row.changed_at.slice(0, 10)}`;
		const existing = touchesByConceptDay.get(key);
		const kind = row.old_status === null ? "added" : "statusChange";

		if (!existing) {
			touchesByConceptDay.set(key, {
				conceptId: row.concept_id,
				changedAt: row.changed_at,
				category: categoryByConcept.get(row.concept_id) ?? "Uncategorized",
				kind,
			});
		} else if (kind === "added") {
			existing.kind = "added";
			existing.changedAt = row.changed_at;
		}
	}

	const currentTouches: FocusTouch[] = [];
	const previousTouches: FocusTouch[] = [];
	for (const touch of touchesByConceptDay.values()) {
		if (touch.changedAt >= currentStartIso) currentTouches.push(touch);
		else previousTouches.push(touch);
	}

	const summarize = (touches: FocusTouch[]) => {
		const categories = new Map<
			string,
			{ events: number; added: number; statusChanges: number }
		>();
		for (const touch of touches) {
			const summary = categories.get(touch.category) ?? {
				events: 0,
				added: 0,
				statusChanges: 0,
			};
			summary.events++;
			if (touch.kind === "added") summary.added++;
			else summary.statusChanges++;
			categories.set(touch.category, summary);
		}
		return categories;
	};

	const currentCategories = summarize(currentTouches);
	const previousCategories = summarize(previousTouches);
	const previousTotalEvents = previousTouches.length;

	const categories = [...currentCategories]
		.map(([name, summary]) => {
			const previousEvents = previousCategories.get(name)?.events ?? 0;
			const share =
				currentTouches.length > 0
					? (summary.events / currentTouches.length) * 100
					: 0;
			const previousShare =
				previousTotalEvents > 0
					? (previousEvents / previousTotalEvents) * 100
					: null;
			return {
				name,
				...summary,
				previousEvents,
				share,
				shareDelta: previousShare === null ? null : share - previousShare,
			};
		})
		.sort((a, b) => b.events - a.events || a.name.localeCompare(b.name));

	const bucketDays = rangeDays / 6;
	const bucketMs = bucketDays * dayMs;
	const buckets = Array.from({ length: 6 }, (_, index) => {
		const start = new Date(currentStart.getTime() + index * bucketMs);
		const end = new Date(start.getTime() + bucketMs);
		return {
			startDate: start.toISOString().slice(0, 10),
			endDate: new Date(end.getTime() - dayMs).toISOString().slice(0, 10),
			total: 0,
			added: 0,
			statusChanges: 0,
			categoryEvents: {} as Record<string, number>,
		};
	});

	for (const touch of currentTouches) {
		const index = Math.min(
			buckets.length - 1,
			Math.floor(
				(Date.parse(touch.changedAt) - currentStart.getTime()) / bucketMs,
			),
		);
		const bucket = buckets[index];
		bucket.total++;
		if (touch.kind === "added") bucket.added++;
		else bucket.statusChanges++;
		bucket.categoryEvents[touch.category] =
			(bucket.categoryEvents[touch.category] ?? 0) + 1;
	}

	const added = currentTouches.filter((touch) => touch.kind === "added").length;
	const totalDelta =
		previousTotalEvents > 0
			? ((currentTouches.length - previousTotalEvents) / previousTotalEvents) *
				100
			: null;

	return {
		rangeDays,
		totalEvents: currentTouches.length,
		previousTotalEvents,
		totalDelta,
		added,
		statusChanges: currentTouches.length - added,
		categories,
		buckets,
	};
}

/**
 * The most recently logged concepts for the "Recently learned" list, newest
 * first (id breaks ties for concepts sharing a timestamp). Each concept carries
 * its linked technology names and the single area it strengthened: its direct
 * category link, or the closest category its technology reaches
 * (see resolveTechnologyCategories).
 */
export function getRecentlyLearnedConcepts(
	limit = 6,
): RecentlyLearnedConcept[] {
	const db = getDatabase();

	const concepts = db
		.prepare(
			"SELECT id, name, slug, created_at FROM concept ORDER BY created_at DESC, id DESC LIMIT ?",
		)
		.all(limit) as {
		id: number;
		name: string;
		slug: string;
		created_at: string;
	}[];
	if (concepts.length === 0) return [];

	const conceptIds = new Set(concepts.map((c) => c.id));

	const categoryNameById = new Map<number, string>();
	for (const { id, name } of db
		.prepare("SELECT id, name FROM category")
		.all() as { id: number; name: string }[]) {
		categoryNameById.set(id, name);
	}
	const technologyNameById = new Map<number, string>();
	for (const { id, name } of db
		.prepare("SELECT id, name FROM technology")
		.all() as { id: number; name: string }[]) {
		technologyNameById.set(id, name);
	}
	const techCategories = resolveTechnologyCategories(db);

	// Only the shown concepts' links matter, so filter as we group.
	const techIdsByConcept = new Map<number, number[]>();
	for (const { concept_id, technology_id } of db
		.prepare("SELECT concept_id, technology_id FROM concept_technology")
		.all() as { concept_id: number; technology_id: number }[]) {
		if (!conceptIds.has(concept_id)) continue;
		const list = techIdsByConcept.get(concept_id) ?? [];
		list.push(technology_id);
		techIdsByConcept.set(concept_id, list);
	}
	const categoryIdByConcept = new Map<number, number>();
	for (const { concept_id, category_id } of db
		.prepare("SELECT concept_id, category_id FROM concept_category")
		.all() as { concept_id: number; category_id: number }[]) {
		if (!conceptIds.has(concept_id)) continue;
		categoryIdByConcept.set(concept_id, category_id);
	}

	return concepts.map((concept) => {
		const techIds = techIdsByConcept.get(concept.id) ?? [];
		const technologies = techIds
			.map((id) => technologyNameById.get(id))
			.filter((name): name is string => name !== undefined)
			.sort();

		// Direct category link wins; otherwise take the closest category the
		// concept's technology reaches.
		let categoryId = categoryIdByConcept.get(concept.id);
		if (categoryId === undefined) {
			for (const techId of techIds) {
				const reached = techCategories.get(techId);
				if (reached && reached.length > 0) {
					categoryId = reached[0];
					break;
				}
			}
		}

		return {
			id: concept.id,
			name: concept.name,
			slug: concept.slug,
			createdAt: concept.created_at,
			technologies,
			category:
				categoryId !== undefined
					? (categoryNameById.get(categoryId) ?? null)
					: null,
		};
	});
}
