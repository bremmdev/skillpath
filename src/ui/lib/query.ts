import { queryOptions } from "@tanstack/react-query";
import type {
	Category,
	DashboardStats,
	RecentlyLearnedConcept,
	SkillTreeCategory,
} from "#/electron/db/types";

export const categoriesQueryOptions = queryOptions<Category[]>({
	queryKey: ["categories"],
	queryFn: () => window.api.categories.get(),
});

export const skillTreeQueryOptions = queryOptions<SkillTreeCategory[]>({
	queryKey: ["skillTree"],
	queryFn: () => window.api.skillTree.get(),
});

export const dashboardStatsQueryOptions = queryOptions<DashboardStats>({
	queryKey: ["dashboard", "stats"],
	queryFn: () => window.api.dashboard.stats(),
});

export const recentlyLearnedQueryOptions = queryOptions<
	RecentlyLearnedConcept[]
>({
	queryKey: ["dashboard", "recentlyLearned"],
	queryFn: () => window.api.dashboard.recentlyLearned(),
});
