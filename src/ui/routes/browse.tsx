import { createFileRoute } from "@tanstack/react-router";

import { BrowseExplorer } from "@/ui/components/browse/browse-explorer";

// Route structure for the browse surface:
//   browse.tsx                → /browse                  (this file: the explorer)
//   browse.$type.$slug.tsx    → /browse/technology/azure (entity detail — later)
//
// When detail pages arrive, make this a layout route (render <Outlet/>) and move
// the explorer into browse.index.tsx. The mock tree lives in ui/data/browse.ts;
// swap it for a query (see ui/lib/query.ts + electron/db/db-query.ts) later.
export const Route = createFileRoute("/browse")({
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
