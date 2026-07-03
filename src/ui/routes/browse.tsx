import { createFileRoute } from "@tanstack/react-router";

import { BrowseExplorer } from "@/ui/components/browse/browse-explorer";
import { skillTreeQueryOptions } from "@/ui/lib/query";

// Route structure for the browse surface:
//   browse.tsx                → /browse                  (this file: the explorer)
//   browse.$type.$slug.tsx    → /browse/technology/azure (entity detail — later)
//
// When detail pages arrive, make this a layout route (render <Outlet/>) and move
// the explorer into browse.index.tsx.
export const Route = createFileRoute("/browse")({
	loader: ({ context: { queryClient } }) => {
		return queryClient.ensureQueryData(skillTreeQueryOptions);
	},
	// The loader awaits ensureQueryData, so a failed query (thrown in the main
	// process, re-thrown across IPC) rejects the loader and lands here.
	errorComponent: ({ error, reset }) => (
		<div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
			<p className="text-muted-foreground">
				Couldn't load the skill tree: {error.message}
			</p>
			<button
				onClick={reset}
				className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium"
			>
				Retry
			</button>
		</div>
	),
	component: Browse,
});

function Browse() {
	return (
		<>
				<div>
					<h1 className="font-heading text-2xl font-semibold tracking-tight">
						Browse
					</h1>
					<p className="text-muted-foreground mt-1 text-sm">
						Drill into every category, technology, and concept you're tracking.
					</p>
				</div>
				<BrowseExplorer />
				</>
	);
}
