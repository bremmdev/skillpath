import { createFileRoute } from "@tanstack/react-router";
import { GreetingHeader } from "@/ui/components/dashboard/greeting-header";
import { KnowledgeMap } from "@/ui/components/dashboard/knowledge-map";
import { LearningFocus } from "@/ui/components/dashboard/learning-focus";
import { RecentlyLearned } from "@/ui/components/dashboard/recently-learned";
import { StatsOverview } from "@/ui/components/dashboard/stats-overview";
import {
	dashboardStatsQueryOptions,
	learningFocusQueryOptions,
	recentlyLearnedQueryOptions,
} from "@/ui/lib/query";

export const Route = createFileRoute("/")({
	loader: ({ context: { queryClient } }) => {
		// Warm dashboard queries in parallel so the suspense components below
		// render without a client-side fetch waterfall.
		return Promise.all([
			queryClient.ensureQueryData(dashboardStatsQueryOptions),
			queryClient.ensureQueryData(recentlyLearnedQueryOptions),
			queryClient.ensureQueryData(learningFocusQueryOptions(30)),
			queryClient.ensureQueryData(learningFocusQueryOptions(90)),
		]);
	},
	// The loader awaits ensureQueryData, so a failed query (thrown in the main
	// process, re-thrown across IPC) rejects the loader and lands here.
	errorComponent: ({ error, reset }) => (
		<div className="bg-background flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
			<p className="text-muted-foreground">
				Couldn't load your dashboard: {error.message}
			</p>
			<button
				type="button"
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
	return (
		<>
			<GreetingHeader />
			<StatsOverview />

			<LearningFocus />

			<section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<RecentlyLearned />
				<KnowledgeMap />
			</section>
		</>
	);
}
