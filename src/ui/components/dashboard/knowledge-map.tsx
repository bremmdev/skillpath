import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/ui/components/ui/card";

const legend = [
	{
		label: "Category",
		className: "border-muted-foreground border bg-transparent",
	},
	{ label: "Technology", className: "bg-chart-2" },
	{ label: "Concept", className: "bg-muted-foreground/50" },
];

function Legend() {
	return (
		<div className="flex items-center gap-4">
			{legend.map((item) => (
				<div
					key={item.label}
					className="text-muted-foreground flex items-center gap-1.5 text-xs"
				>
					<span className={`size-2.5 rounded-full ${item.className}`} />
					{item.label}
				</div>
			))}
		</div>
	);
}

export function KnowledgeMap() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Knowledge map</CardTitle>
				<CardDescription>
					How concepts connect to technologies and categories
				</CardDescription>
				<CardAction>
					<Legend />
				</CardAction>
			</CardHeader>
			<CardContent>
				{/* Visualization intentionally left empty for now. */}
				<div className="flex min-h-72 items-center justify-center rounded-lg" />
			</CardContent>
		</Card>
	);
}
