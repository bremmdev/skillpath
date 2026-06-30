import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import {
	Card,
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
import type { SkillProfileHighlight } from "@/ui/data/dashboard";
import { skillProfile } from "@/ui/data/dashboard";

const chartConfig = {
	score: {
		label: "Skill profile",
		color: "var(--chart-2)",
	},
} satisfies ChartConfig;

function Highlight({ highlight }: { highlight: SkillProfileHighlight }) {
	return (
		<div className="rounded-lg border p-3">
			<p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
				{highlight.label}
			</p>
			<p className="mt-1.5 text-sm font-semibold">{highlight.value}</p>
			<p className="text-muted-foreground mt-0.5 text-xs">
				{highlight.caption}
			</p>
		</div>
	);
}

export function SkillProfile() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Skill profile over time</CardTitle>
				<CardDescription>How has my profile changed?</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-6">
				<div className="flex items-baseline gap-2">
					<span className="font-heading text-4xl font-semibold tracking-tight tabular-nums">
						{skillProfile.score}%
					</span>
					<span className="text-chart-2 text-sm font-medium">
						+{skillProfile.deltaSinceJan} since Jan
					</span>
				</div>

				<ChartContainer
					config={chartConfig}
					className="aspect-auto h-44 w-full"
				>
					<AreaChart
						accessibilityLayer
						data={skillProfile.series}
						margin={{ left: 18, right: 18, top: 4, bottom: 0 }}
					>
						<defs>
							<linearGradient id="fillScore" x1="0" y1="0" x2="0" y2="1">
								<stop
									offset="5%"
									stopColor="var(--color-score)"
									stopOpacity={0.3}
								/>
								<stop
									offset="95%"
									stopColor="var(--color-score)"
									stopOpacity={0.03}
								/>
							</linearGradient>
						</defs>
						<CartesianGrid vertical={false} strokeDasharray="3 3" />
						<XAxis
							dataKey="month"
							tickLine={false}
							axisLine={false}
							tickMargin={10}
							interval={0}
							minTickGap={0}
						/>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent indicator="line" />}
						/>
						<Area
							dataKey="score"
							type="monotone"
							stroke="var(--color-score)"
							strokeWidth={2}
							fill="url(#fillScore)"
							isAnimationActive={false}
							dot={false}
						/>
					</AreaChart>
				</ChartContainer>

				<div className="grid grid-cols-3 gap-3">
					{skillProfile.highlights.map((highlight) => (
						<Highlight key={highlight.label} highlight={highlight} />
					))}
				</div>
			</CardContent>
		</Card>
	);
}
