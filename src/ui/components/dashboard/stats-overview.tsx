import { useSuspenseQuery } from "@tanstack/react-query";

import type { DashboardStats } from "#/electron/db/types";
import { Card } from "@/ui/components/ui/card";
import { dashboardStatsQueryOptions } from "@/ui/lib/query";

type StatCardData = {
	id: string;
	label: string;
	value: string;
	caption: string;
};

const plural = (n: number, singular: string, plural = `${singular}s`) =>
	n === 1 ? singular : plural;

// Turns the raw dashboard counts into the four display cards. Presentation copy
// lives here (not the backend) so the query stays free of UI strings.
function buildStatCards(stats: DashboardStats): StatCardData[] {
	return [
		{
			id: "concepts",
			label: "Concepts logged",
			value: String(stats.conceptsLogged),
			caption:
				stats.conceptsThisWeek > 0
					? `+${stats.conceptsThisWeek} this week`
					: "No new concepts this week",
		},
		{
			id: "technologies",
			label: "Technologies",
			value: String(stats.technologies),
			caption: `across ${stats.categoriesWithTechnologies} ${plural(
				stats.categoriesWithTechnologies,
				"category",
				"categories",
			)}`,
		},
		{
			id: "categories",
			label: "Active categories",
			value: String(stats.activeCategories),
			caption: `of ${stats.totalCategories} tracked`,
		},
		{
			id: "streak",
			label: "Day streak",
			value: String(stats.dayStreak),
			caption:
				stats.dayStreak > 0 && stats.dayStreak >= stats.longestStreak
					? "personal best"
					: `best: ${stats.longestStreak} ${plural(stats.longestStreak, "day")}`,
		},
	];
}

function StatCard({ stat }: { stat: StatCardData }) {
	return (
		<Card className="gap-0 py-5">
			<div className="flex items-start justify-between gap-3 px-5">
				<div className="min-w-0">
					<p className="text-muted-foreground text-sm font-medium">
						{stat.label}
					</p>
					<p className="font-heading mt-2 text-3xl font-semibold tracking-tight tabular-nums">
						{stat.value}
					</p>
				</div>
			</div>
			<p className="text-muted-foreground mt-3 px-5 text-xs">{stat.caption}</p>
		</Card>
	);
}

export function StatsOverview() {
	const { data: stats } = useSuspenseQuery(dashboardStatsQueryOptions);
	const cards = buildStatCards(stats);

	return (
		<section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{cards.map((stat) => (
				<StatCard key={stat.id} stat={stat} />
			))}
		</section>
	);
}
