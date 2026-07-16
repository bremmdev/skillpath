import { useSuspenseQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { SkillTree } from "@/ui/components/browse/skill-tree";
import { Button } from "@/ui/components/ui/button";
import { Card, CardContent } from "@/ui/components/ui/card";
import { Input } from "@/ui/components/ui/input";
import type {
	BrowseCategory,
	BrowseFilters,
	BrowseTechnology,
} from "@/ui/data/browse";
import {
	type ConceptStatus,
	conceptImportances,
	conceptStatuses,
	filterTree,
	hasActiveFilters,
	statusMeta,
} from "@/ui/data/browse";
import { skillTreeQueryOptions } from "@/ui/lib/query";
import { cn } from "@/ui/lib/utils";

function collectTechnologyIds(technologies: BrowseTechnology[]): string[] {
	return technologies.flatMap((technology) => [
		technology.id,
		...collectTechnologyIds(technology.children ?? []),
	]);
}

function collectBranchIds(tree: BrowseCategory[]): string[] {
	return tree.flatMap((category) => [
		category.id,
		...collectTechnologyIds(category.technologies),
	]);
}

function Chip({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"border px-2.5 py-1 text-xs font-medium transition-colors",
				active
					? "border-foreground bg-foreground text-background"
					: "border-border text-muted-foreground hover:text-foreground",
			)}
		>
			{children}
		</button>
	);
}

function FilterGroup({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex items-center gap-1.5">
			<span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
				{label}
			</span>
			{children}
		</div>
	);
}

export function BrowseExplorer() {
	// The route loader primes this query, so the data is here on first render.
	const { data: skillTree } = useSuspenseQuery(skillTreeQueryOptions);

	const [query, setQuery] = useState("");
	const [statuses, setStatuses] = useState<ConceptStatus[]>([]);
	const [importances, setImportances] = useState<number[]>([]);
	// Categories start expanded; the set only tracks manual toggles.
	const [expanded, setExpanded] = useState<Set<string>>(
		() => new Set(skillTree.map((category) => category.id)),
	);

	const filters: BrowseFilters = { query, statuses, importances };
	const filtered = useMemo(
		() => filterTree(skillTree, { query, statuses, importances }),
		[skillTree, query, statuses, importances],
	);
	const branchIds = useMemo(() => collectBranchIds(skillTree), [skillTree]);
	const active = hasActiveFilters(filters);
	const allExpanded = branchIds.every((id) => expanded.has(id));

	// While filtering, force every branch open so matches are always visible.
	const isOpen = (id: string) => active || expanded.has(id);
	const toggle = (id: string) =>
		setExpanded((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	const toggleAll = () =>
		setExpanded(allExpanded ? new Set() : new Set(branchIds));

	const toggleStatus = (status: ConceptStatus) =>
		setStatuses((prev) =>
			prev.includes(status)
				? prev.filter((s) => s !== status)
				: [...prev, status],
		);

	const toggleImportance = (level: number) =>
		setImportances((prev) =>
			prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level],
		);

	const clear = () => {
		setQuery("");
		setStatuses([]);
		setImportances([]);
	};

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-3">
				<div className="flex flex-wrap items-center gap-2">
					<div className="relative w-full max-w-sm">
						<Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-0 size-4 -translate-y-1/2" />
						<Input
							type="search"
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Filter concepts, technologies, categories…"
							className="pl-6"
							aria-label="Filter"
						/>
					</div>
					<Button
						size="sm"
						className="h-9 gap-1.5 px-3"
						onClick={toggleAll}
						disabled={active}
						title={
							active
								? "Matching branches are expanded automatically"
								: undefined
						}
					>
						{allExpanded ? "Collapse all" : "Expand all"}
					</Button>
				</div>

				<div className="flex flex-wrap items-center gap-x-6 gap-y-3">
					<FilterGroup label="Status">
						{conceptStatuses.map((status) => (
							<Chip
								key={status}
								active={statuses.includes(status)}
								onClick={() => toggleStatus(status)}
							>
								{statusMeta[status].label}
							</Chip>
						))}
					</FilterGroup>

					<FilterGroup label="Importance">
						{conceptImportances.map((level) => (
							<Chip
								key={level}
								active={importances.includes(level)}
								onClick={() => toggleImportance(level)}
							>
								{level}
							</Chip>
						))}
					</FilterGroup>

					{active && (
						<Button variant="ghost" size="xs" onClick={clear}>
							Clear
						</Button>
					)}
				</div>
			</div>

			{filtered.length > 0 ? (
				<SkillTree tree={filtered} isOpen={isOpen} toggle={toggle} />
			) : (
				<Card>
					<CardContent className="text-muted-foreground py-16 text-center text-sm">
						No concepts match your filters.
					</CardContent>
				</Card>
			)}
		</div>
	);
}
