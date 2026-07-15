import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import type {
	LearningFocusCategory,
	LearningFocusRange,
} from "#/electron/db/types";
import { Button } from "@/ui/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/ui/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/ui/components/ui/chart";
import { learningFocusQueryOptions } from "@/ui/lib/query";

const categoryColors = [
	"var(--chart-2)",
	"var(--chart-4)",
	"var(--chart-1)",
	"var(--chart-3)",
] as const;

function formatBucket(startDate: string, endDate: string) {
	const format = (value: string) =>
		new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			timeZone: "UTC",
		});

	return `${format(startDate)}–${format(endDate)}`;
}

function formatSigned(value: number, suffix: string) {
	const rounded = Math.round(value);
	return `${rounded > 0 ? "+" : ""}${rounded}${suffix}`;
}

function describeShareChange(
	category: LearningFocusCategory,
	range: LearningFocusRange,
) {
	if (category.shareDelta === null) {
		return `No previous ${range}-day comparison`;
	}
	if (category.previousEvents === 0) {
		return "New focus this period";
	}

	const change = Math.round(category.shareDelta);
	if (change === 0) return "Focus share unchanged";

	const points = Math.abs(change);
	return `Focus share ${change > 0 ? "up" : "down"} ${points} ${
		points === 1 ? "point" : "points"
	} vs previous ${range} days`;
}

export function LearningFocus() {
	const [range, setRange] = useState<LearningFocusRange>(30);
	const { data } = useSuspenseQuery(learningFocusQueryOptions(range));
	const chartCategories = data.categories.slice(0, 4);
	const chartCategoryNames = new Set(
		chartCategories.map((category) => category.name),
	);
	const hasOther = data.categories.length > chartCategories.length;
	const series = [
		...chartCategories.map((category, index) => ({
			key: `category${index}`,
			name: category.name,
			color: categoryColors[index],
		})),
		...(hasOther
			? [{ key: "other", name: "Other", color: "var(--muted-foreground)" }]
			: []),
	];
	const chartConfig: ChartConfig = Object.fromEntries(
		series.map((item) => [item.key, { label: item.name, color: item.color }]),
	);
	const chartData = data.buckets.map((bucket) => {
		const row: Record<string, string | number> = {
			label: formatBucket(bucket.startDate, bucket.endDate),
		};
		chartCategories.forEach((category, index) => {
			row[`category${index}`] = bucket.categoryEvents[category.name] ?? 0;
		});
		if (hasOther) {
			row.other = Object.entries(bucket.categoryEvents)
				.filter(([name]) => !chartCategoryNames.has(name))
				.reduce((total, [, count]) => total + count, 0);
		}
		return row;
	});
	const topCategory = data.categories[0];

	return (
		<Card>
			<CardHeader>
				<CardTitle>Learning focus</CardTitle>
				<CardDescription>
					Where your learning activity went over the last {range} days
				</CardDescription>
				<CardAction>
					<fieldset className="border-border flex border p-0.5">
						<legend className="sr-only">Learning focus period</legend>
						{([30, 90] as const).map((days) => (
							<Button
								key={days}
								type="button"
								size="xs"
								variant={range === days ? "secondary" : "ghost"}
								aria-pressed={range === days}
								onClick={() => setRange(days)}
							>
								{days} days
							</Button>
						))}
					</fieldset>
				</CardAction>
			</CardHeader>

			<CardContent className="flex flex-col gap-7">
				<div className="border-border grid gap-5 border-y py-5 sm:grid-cols-3 sm:gap-0 sm:divide-x">
					<div className="sm:pr-6">
						<p className="text-muted-foreground text-xs font-medium uppercase">
							Focus events
						</p>
						<p className="font-heading mt-2 text-3xl font-semibold tabular-nums">
							{data.totalEvents}
						</p>
						<p className="text-muted-foreground mt-1 text-xs">
							{data.totalDelta === null
								? "No previous-period comparison"
								: `${formatSigned(data.totalDelta, "%")} vs previous ${range} days`}
						</p>
					</div>

					<div className="sm:px-6">
						<p className="text-muted-foreground text-xs font-medium uppercase">
							Top focus
						</p>
						<p className="mt-2 truncate text-base font-semibold">
							{topCategory?.name ?? "No activity yet"}
						</p>
						<p className="text-muted-foreground mt-1 text-xs">
							{topCategory
								? `${Math.round(topCategory.share)}% of learning activity`
								: `Log a concept to start this ${range}-day view`}
						</p>
					</div>

					<div className="sm:pl-6">
						<p className="text-muted-foreground text-xs font-medium uppercase">
							Activity mix
						</p>
						<p className="mt-2 text-base font-semibold tabular-nums">
							{data.added} added
						</p>
						<p className="text-muted-foreground mt-1 text-xs tabular-nums">
							{data.statusChanges} status{" "}
							{data.statusChanges === 1 ? "change" : "changes"}
						</p>
					</div>
				</div>

				{data.totalEvents === 0 ? (
					<p className="text-muted-foreground py-12 text-center text-sm">
						No concepts were added or updated during this period.
					</p>
				) : (
					<div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(18rem,1fr)]">
						<section>
							<div className="mb-4">
								<h3 className="text-sm font-semibold">Activity over time</h3>
								<p className="text-muted-foreground mt-0.5 text-xs">
									{range === 30 ? "Five-day" : "Fifteen-day"} periods · concepts
									added or updated
								</p>
							</div>
							<ChartContainer
								config={chartConfig}
								className="aspect-auto h-72 w-full"
							>
								<BarChart
									accessibilityLayer
									data={chartData}
									margin={{ left: -8, right: 8, top: 4, bottom: 0 }}
								>
									<CartesianGrid vertical={false} strokeDasharray="3 3" />
									<XAxis
										dataKey="label"
										tickLine={false}
										axisLine={false}
										tickMargin={10}
									/>
									<YAxis
										allowDecimals={false}
										tickLine={false}
										axisLine={false}
										width={32}
									/>
									<ChartTooltip
										cursor={false}
										content={<ChartTooltipContent />}
									/>
									{series.map((item) => (
										<Bar
											key={item.key}
											dataKey={item.key}
											stackId="focus"
											fill={`var(--color-${item.key})`}
											isAnimationActive={false}
										/>
									))}
								</BarChart>
							</ChartContainer>
						</section>

						<section>
							<div className="mb-4">
								<h3 className="text-sm font-semibold">Category share</h3>
								<p className="text-muted-foreground mt-0.5 text-xs">
									Compared with the previous {range} days
								</p>
							</div>
							<ol className="flex flex-col gap-4">
								{data.categories.slice(0, 5).map((category, index) => {
									const color =
										index < categoryColors.length
											? categoryColors[index]
											: "var(--muted-foreground)";
									return (
										<li key={category.name}>
											<div className="flex items-start gap-2.5">
												<span
													className="mt-1.5 size-2 shrink-0"
													style={{ backgroundColor: color }}
												/>
												<div className="min-w-0 flex-1">
													<div className="flex items-baseline justify-between gap-3">
														<span className="truncate text-sm font-medium">
															{category.name}
														</span>
														<span className="shrink-0 text-sm font-semibold tabular-nums">
															{category.events}{" "}
															{category.events === 1 ? "event" : "events"}
														</span>
													</div>
													<div className="text-muted-foreground mt-1 flex justify-between gap-3 text-xs">
														<span>
															{category.added} added · {category.statusChanges}{" "}
															changed
														</span>
														<span className="shrink-0 tabular-nums">
															{Math.round(category.share)}% of focus
														</span>
													</div>
													<div className="bg-muted mt-2 h-1.5 overflow-hidden">
														<div
															className="h-full"
															style={{
																backgroundColor: color,
																width: `${category.share}%`,
															}}
														/>
													</div>
													<p className="text-muted-foreground mt-1.5 text-xs">
														{describeShareChange(category, range)}
													</p>
												</div>
											</div>
										</li>
									);
								})}
							</ol>
						</section>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
