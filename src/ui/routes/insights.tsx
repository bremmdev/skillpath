import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Tabs, TabsList, TabsTrigger } from "@/ui/components/ui/tabs";

// The insights surface is time-series by nature, so the page-global time range
// lives here (not on Home, where streak/recent/totals can't honor it). Held in
// local state for now; the charts land later and will read `range`. When they
// do, this is the spot to lift the range into URL search params so a view is
// shareable/refresh-safe.
const timeRanges = ["Week", "Month", "Year", "All time"] as const;
type TimeRange = (typeof timeRanges)[number];
const defaultTimeRange: TimeRange = "Month";

export const Route = createFileRoute("/insights")({
	component: Insights,
});

function Insights() {
	const [range, setRange] = useState<TimeRange>(defaultTimeRange);

	return (
		<>
			<section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="font-heading text-2xl font-semibold tracking-tight">
						Insights
					</h1>
					<p className="text-muted-foreground mt-1 text-sm">
						Trends across your knowledge over time.
					</p>
				</div>

				<Tabs
					value={range}
					onValueChange={(value) => setRange(value as TimeRange)}
				>
					<TabsList>
						{timeRanges.map((r) => (
							<TabsTrigger key={r} value={r} className="px-3.5">
								{r}
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>
			</section>

			<div className="text-muted-foreground flex min-h-64 items-center justify-center rounded-lg border border-dashed p-8 text-center text-sm">
				<p>
					Charts for the{" "}
					<span className="text-foreground font-medium">{range}</span> range
					will live here.
				</p>
			</div>
		</>
	);
}
