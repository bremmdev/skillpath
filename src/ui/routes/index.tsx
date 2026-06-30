import { createFileRoute } from "@tanstack/react-router";

import { GreetingHeader } from "@/ui/components/dashboard/greeting-header";
import { ImprovingAreas } from "@/ui/components/dashboard/improving-areas";
import { KnowledgeMap } from "@/ui/components/dashboard/knowledge-map";
import { RecentlyLearned } from "@/ui/components/dashboard/recently-learned";
import { SkillProfile } from "@/ui/components/dashboard/skill-profile";
import { StatsOverview } from "@/ui/components/dashboard/stats-overview";
import { TopNav } from "@/ui/components/dashboard/top-nav";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	return (
		<div className="bg-background min-h-screen">
			<TopNav />
			<main className="flex w-full flex-col gap-6 px-6 py-8">
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
			</main>
		</div>
	);
}
