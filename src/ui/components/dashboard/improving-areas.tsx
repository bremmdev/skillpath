import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/ui/components/ui/card";
import type { ImprovingArea } from "@/ui/data/dashboard";
import { improvingAreas } from "@/ui/data/dashboard";

function AreaRow({ area }: { area: ImprovingArea }) {
	return (
		<div className="grid grid-cols-[10rem_1fr_auto] items-center gap-4">
			<span className="truncate text-sm font-medium">{area.category}</span>
			<div className="bg-muted h-2 overflow-hidden rounded-full">
				<div
					className="bg-chart-2 h-full rounded-full"
					style={{ width: `${area.strength}%` }}
				/>
			</div>
			<div className="flex items-center gap-2 text-sm tabular-nums">
				<span className="text-muted-foreground w-6 text-right">
					{area.strength}
				</span>
				<span className="text-chart-2 w-6 text-right font-medium">
					+{area.delta}
				</span>
			</div>
		</div>
	);
}

export function ImprovingAreas() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Improving areas</CardTitle>
				<CardDescription>Foundation strength · 30-day change</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				{improvingAreas.map((area) => (
					<AreaRow key={area.category} area={area} />
				))}
			</CardContent>
		</Card>
	);
}
