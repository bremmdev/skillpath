import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { GreetingHeader } from "@/ui/components/dashboard/greeting-header";
import { ImprovingAreas } from "@/ui/components/dashboard/improving-areas";
import { KnowledgeMap } from "@/ui/components/dashboard/knowledge-map";
import { RecentlyLearned } from "@/ui/components/dashboard/recently-learned";
import { SkillProfile } from "@/ui/components/dashboard/skill-profile";
import { StatsOverview } from "@/ui/components/dashboard/stats-overview";
import { categoriesQueryOptions } from "@/ui/lib/query";

export const Route = createFileRoute("/")({
	loader: ({ context: { queryClient } }) => {
		return queryClient.ensureQueryData(categoriesQueryOptions);
	},
	// The loader awaits ensureQueryData, so a failed query (thrown in the main
	// process, re-thrown across IPC) rejects the loader and lands here.
	errorComponent: ({ error, reset }) => (
		<div className="bg-background flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
			<p className="text-muted-foreground">
				Couldn't load your dashboard: {error.message}
			</p>
			<button
				onClick={reset}
				className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium"
			>
				Retry
			</button>
		</div>
	),
	component: Home,
});

function Home() {
	const { data: categories } = useSuspenseQuery(categoriesQueryOptions);

	console.log(categories);

	return (
		<>
				<GreetingHeader />
				<StatsOverview />

				<section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
					<RecentlyLearned />
					<SkillProfile />
				</section>

				<section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
					<KnowledgeMap />
					<ImprovingAreas />
				</section>
		</>
	);
}
