import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { SkillMap } from "@/ui/components/skill-map";
import { skillTreeQueryOptions } from "@/ui/lib/query";

export const Route = createFileRoute("/skill-map")({
	loader: ({ context: { queryClient } }) =>
		queryClient.ensureQueryData(skillTreeQueryOptions),
	errorComponent: ({ error, reset }) => (
		<div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
			<p className="text-muted-foreground">
				Couldn't load the skill map: {error.message}
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
	component: SkillMapRoute,
});

function SkillMapRoute() {
	const { data: categories } = useSuspenseQuery(skillTreeQueryOptions);

	return (
		<>
			<div>
				<h1 className="font-heading text-2xl font-semibold tracking-tight">
					Skill map
				</h1>
				<p className="text-muted-foreground mt-1 text-sm">
					Explore how your categories, technologies, and concepts connect.
					Larger nodes represent areas with more concepts.
				</p>
			</div>
			<SkillMap categories={categories} />
		</>
	);
}
