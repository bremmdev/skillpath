import { ArrowRight, Triangle } from "lucide-react";

import { Badge } from "@/ui/components/ui/badge";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/ui/components/ui/card";
import type { RecentConcept } from "@/ui/data/dashboard";
import { recentConcepts } from "@/ui/data/dashboard";

function ConceptRow({ concept }: { concept: RecentConcept }) {
	return (
		<li className="flex items-start gap-3 py-3.5">
			<span className="bg-chart-2 mt-1.5 size-2 shrink-0 rounded-full" />
			<div className="min-w-0 flex-1">
				<p className="text-sm font-medium">{concept.title}</p>
				<div className="mt-1.5 flex flex-wrap gap-1.5">
					{concept.technologies.map((tech) => (
						<Badge
							key={tech}
							variant="secondary"
							className="text-muted-foreground font-normal"
						>
							{tech}
						</Badge>
					))}
				</div>
			</div>
			<div className="flex flex-col items-end gap-1.5 text-right">
				<span className="text-muted-foreground text-xs">{concept.timeAgo}</span>
				<span className="text-chart-2 flex items-center gap-1 text-xs font-medium">
					<Triangle className="size-2.5 fill-current" />
					{concept.category}
				</span>
			</div>
		</li>
	);
}

export function RecentlyLearned() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Recently learned</CardTitle>
				<CardDescription>
					What you logged, and the area it strengthened
				</CardDescription>
				<CardAction>
					<button
						type="button"
						className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm font-medium transition-colors"
					>
						View all
						<ArrowRight className="size-3.5" />
					</button>
				</CardAction>
			</CardHeader>
			<CardContent>
				<ul className="divide-border divide-y">
					{recentConcepts.map((concept) => (
						<ConceptRow key={concept.id} concept={concept} />
					))}
				</ul>
			</CardContent>
		</Card>
	);
}
