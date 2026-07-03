import { ChevronRight, Layers } from "lucide-react";

import { Badge } from "@/ui/components/ui/badge";
import { Card } from "@/ui/components/ui/card";
import type {
	BrowseCategory,
	BrowseConcept,
	BrowseTechnology,
} from "@/ui/data/browse";
import {
	countConcepts,
	countTechnologyConcepts,
	statusMeta,
} from "@/ui/data/browse";
import { cn } from "@/ui/lib/utils";

/** Pixels of indent added per level of nesting. */
const INDENT = 16;
const BASE_PADDING = 12;

type NodeControls = {
	/** Whether a node is currently expanded (forced open while filtering). */
	isOpen: (id: string) => boolean;
	toggle: (id: string) => void;
};

function indent(depth: number) {
	return { paddingLeft: depth * INDENT + BASE_PADDING };
}

function ImportanceDots({ value }: { value: number }) {
	return (
		<span
			className="flex items-center gap-0.5"
			title={`Importance ${value}/5`}
			role="img"
			aria-label={`Importance ${value} of 5`}
		>
			{[1, 2, 3, 4, 5].map((level) => (
				<span
					key={level}
					className={cn(
						"size-1.5 rounded-full",
						level <= value ? "bg-foreground/60" : "bg-muted-foreground/20",
					)}
				/>
			))}
		</span>
	);
}

function ConceptRow({
	concept,
	depth,
}: {
	concept: BrowseConcept;
	depth: number;
}) {
	const meta = statusMeta[concept.status];
	return (
		<div
			className="hover:bg-muted/50 flex items-center gap-3 py-2 pr-3 text-sm transition-colors"
			style={indent(depth)}
		>
			<span className={cn("size-2 shrink-0 rounded-full", meta.dot)} />
			<span className="min-w-0 flex-1 truncate">{concept.name}</span>
			<Badge variant="secondary" className={cn("font-normal", meta.text)}>
				{meta.label}
			</Badge>
			<ImportanceDots value={concept.importance} />
		</div>
	);
}

function TechnologyNode({
	tech,
	depth,
	controls,
}: {
	tech: BrowseTechnology;
	depth: number;
	controls: NodeControls;
}) {
	const open = controls.isOpen(tech.id);
	return (
		<div>
			<button
				type="button"
				onClick={() => controls.toggle(tech.id)}
				aria-expanded={open}
				className="hover:bg-muted/50 flex w-full items-center gap-2 py-2 pr-3 text-left text-sm transition-colors"
				style={indent(depth)}
			>
				<ChevronRight
					className={cn(
						"text-muted-foreground size-4 shrink-0 transition-transform",
						open && "rotate-90",
					)}
				/>
				<Layers className="text-chart-2 size-4 shrink-0" />
				<span className="min-w-0 flex-1 truncate font-medium">{tech.name}</span>
				<span className="text-muted-foreground text-xs tabular-nums">
					{countTechnologyConcepts(tech)}
				</span>
			</button>
			{open && (
				<div>
					{(tech.children ?? []).map((child) => (
						<TechnologyNode
							key={child.id}
							tech={child}
							depth={depth + 1}
							controls={controls}
						/>
					))}
					{tech.concepts.map((concept) => (
						<ConceptRow key={concept.id} concept={concept} depth={depth + 1} />
					))}
				</div>
			)}
		</div>
	);
}

function CategoryNode({
	category,
	controls,
}: {
	category: BrowseCategory;
	controls: NodeControls;
}) {
	const open = controls.isOpen(category.id);
	return (
		<div className="border-border border-b last:border-b-0">
			<button
				type="button"
				onClick={() => controls.toggle(category.id)}
				aria-expanded={open}
				className="hover:bg-muted/50 flex w-full items-center gap-2 px-3 py-3 text-left transition-colors"
			>
				<ChevronRight
					className={cn(
						"text-muted-foreground size-4 shrink-0 transition-transform",
						open && "rotate-90",
					)}
				/>
				<span className="font-heading min-w-0 flex-1 truncate text-sm font-semibold tracking-wider uppercase">
					{category.name}
				</span>
				<Badge variant="secondary" className="font-normal">
					{countConcepts(category)} concepts
				</Badge>
			</button>
			{open && (
				<div className="pb-1">
					{category.technologies.map((tech) => (
						<TechnologyNode
							key={tech.id}
							tech={tech}
							depth={1}
							controls={controls}
						/>
					))}
					{category.concepts.map((concept) => (
						<ConceptRow key={concept.id} concept={concept} depth={1} />
					))}
				</div>
			)}
		</div>
	);
}

export function SkillTree({
	tree,
	isOpen,
	toggle,
}: {
	tree: BrowseCategory[];
} & NodeControls) {
	const controls: NodeControls = { isOpen, toggle };
	return (
		<Card className="gap-0 py-0">
			{tree.map((category) => (
				<CategoryNode
					key={category.id}
					category={category}
					controls={controls}
				/>
			))}
		</Card>
	);
}
