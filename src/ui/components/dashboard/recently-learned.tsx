import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Triangle } from "lucide-react";

import type { RecentlyLearnedConcept } from "#/electron/db/types";
import { Badge } from "@/ui/components/ui/badge";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/ui/components/ui/card";
import { formatRelativeTime } from "@/ui/lib/format";
import { recentlyLearnedQueryOptions } from "@/ui/lib/query";

function ConceptRow({ concept }: { concept: RecentlyLearnedConcept }) {
	return (
		<li className="flex items-start gap-3 py-3.5">
			<span className="bg-chart-2 mt-1.5 size-2 shrink-0 rounded-full" />
			<div className="min-w-0 flex-1">
				<p className="text-sm font-medium">{concept.name}</p>
				{concept.technologies.length > 0 && (
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
				)}
			</div>
			<div className="flex flex-col items-end gap-1.5 text-right">
				<span className="text-muted-foreground text-xs">
					{formatRelativeTime(concept.createdAt)}
				</span>
				{concept.category && (
					<span className="text-chart-2 flex items-center gap-1 text-xs font-medium">
						<Triangle className="size-2.5 fill-current" />
						{concept.category}
					</span>
				)}
			</div>
		</li>
	);
}

export function RecentlyLearned() {
	const { data: concepts } = useSuspenseQuery(recentlyLearnedQueryOptions);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Recently learned</CardTitle>
				<CardDescription>
					What you logged, and the area it strengthened
				</CardDescription>
				<CardAction>
					<Link
						to="/browse"
						className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm font-medium transition-colors"
					>
						View all concepts
						<ArrowRight className="size-3.5" />
					</Link>
				</CardAction>
			</CardHeader>
			<CardContent>
				{concepts.length === 0 ? (
					<p className="text-muted-foreground py-4 text-sm">
						Nothing logged yet. Add a concept to see it here.
					</p>
				) : (
					<ul className="divide-border divide-y">
						{concepts.map((concept) => (
							<ConceptRow key={concept.id} concept={concept} />
						))}
					</ul>
				)}
			</CardContent>
		</Card>
	);
}
