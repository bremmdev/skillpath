import { ChevronRight, Info, Layers } from "lucide-react";
import { useState } from "react";

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

/** Alphabetical comparator for named tree nodes. */
function byName(a: { name: string }, b: { name: string }) {
	return a.name.localeCompare(b.name);
}

function ImportanceDots({ value }: { value: number }) {
	return (
		<span
			className="flex items-center gap-0.5"
			title={`Importance ${value}/3`}
			role="img"
			aria-label={`Importance ${value} of 3`}
		>
			{[1, 2, 3].map((level) => (
				<span
					key={level}
					className={cn(
						"size-2 rounded-full",
						level <= value ? "bg-foreground/60" : "bg-muted-foreground/20",
					)}
				/>
			))}
		</span>
	);
}

/** ⓘ button that toggles a node's inline description. */
function DescriptionToggle({
	open,
	onToggle,
	label,
}: {
	open: boolean;
	onToggle: () => void;
	label: string;
}) {
	return (
		<button
			type="button"
			onClick={onToggle}
			aria-expanded={open}
			aria-label={`${open ? "Hide" : "Show"} description for ${label}`}
			title={open ? "Hide description" : "Show description"}
			className={cn(
				"hover:text-foreground shrink-0 rounded-sm transition-colors",
				open ? "text-foreground" : "text-muted-foreground/70",
			)}
		>
			<Info className="size-4" />
		</button>
	);
}

/** Inline description text, indented to sit under the row it belongs to. */
function DescriptionPanel({ text, depth }: { text: string; depth: number }) {
	return (
		<p
			className="text-muted-foreground max-w-prose pr-6 pb-2 text-xs leading-relaxed"
			style={{ paddingLeft: depth * INDENT + BASE_PADDING + 28 }}
		>
			{text}
		</p>
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
	const [showDescription, setShowDescription] = useState(false);
	const { description } = concept;
	return (
		<div>
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
				{description && (
					<DescriptionToggle
						open={showDescription}
						onToggle={() => setShowDescription((v) => !v)}
						label={concept.name}
					/>
				)}
			</div>
			{description && showDescription && (
				<DescriptionPanel text={description} depth={depth} />
			)}
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
	const [showDescription, setShowDescription] = useState(false);
	const { description } = tech;
	return (
		<div>
			<div
				className="hover:bg-muted/50 flex items-center gap-2 pr-3 transition-colors"
				style={indent(depth)}
			>
				<button
					type="button"
					onClick={() => controls.toggle(tech.id)}
					aria-expanded={open}
					className="flex min-w-0 flex-1 items-center gap-2 py-2 text-left text-base"
				>
					<ChevronRight
						className={cn(
							"text-muted-foreground size-4 shrink-0 transition-transform",
							open && "rotate-90",
						)}
					/>
					<Layers className="text-chart-2 size-4 shrink-0" />
					<span className="min-w-0 flex-1 truncate font-medium">
						{tech.name}
					</span>
					<span className="text-muted-foreground text-xs tabular-nums">
						{countTechnologyConcepts(tech)}
					</span>
				</button>
				{description && (
					<DescriptionToggle
						open={showDescription}
						onToggle={() => setShowDescription((v) => !v)}
						label={tech.name}
					/>
				)}
			</div>
			{description && showDescription && (
				<DescriptionPanel text={description} depth={depth} />
			)}
			{open && (
				<div>
					{[...(tech.children ?? [])].sort(byName).map((child) => (
						<TechnologyNode
							key={child.id}
							tech={child}
							depth={depth + 1}
							controls={controls}
						/>
					))}
					{[...tech.concepts]
						.sort(byName)
						.map((concept) => (
							<ConceptRow
								key={concept.id}
								concept={concept}
								depth={depth + 1}
							/>
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
				<Badge variant="secondary" className="font-normal text-xs">
					{countConcepts(category)} concepts
				</Badge>
			</button>
			{open && (
				<div className="pb-1">
					{[...category.technologies].sort(byName).map((tech) => (
						<TechnologyNode
							key={tech.id}
							tech={tech}
							depth={1}
							controls={controls}
						/>
					))}
					{[...category.concepts].sort(byName).map((concept) => (
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
