import { Card } from "@/ui/components/ui/card";
import type { StatCard as StatCardType } from "@/ui/data/dashboard";
import { statCards } from "@/ui/data/dashboard";

function StatCard({ stat }: { stat: StatCardType }) {
	return (
		<Card className="gap-0 py-5">
			<div className="flex items-start justify-between gap-3 px-5">
				<div className="min-w-0">
					<p className="text-muted-foreground text-sm font-medium">
						{stat.label}
					</p>
					<p className="font-heading mt-2 text-3xl font-semibold tracking-tight tabular-nums">
						{stat.value}
					</p>
				</div>
			</div>
			<p className="text-muted-foreground mt-3 px-5 text-xs">{stat.caption}</p>
		</Card>
	);
}

export function StatsOverview() {
	return (
		<section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{statCards.map((stat) => (
				<StatCard key={stat.id} stat={stat} />
			))}
		</section>
	);
}
