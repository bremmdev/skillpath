import {
	Background,
	BackgroundVariant,
	Controls,
	type Edge,
	Handle,
	MarkerType,
	MiniMap,
	type Node,
	type NodeProps,
	type NodeTypes,
	Panel,
	Position,
	ReactFlow,
	type ReactFlowInstance,
	useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Layers3, Map as MapIcon, MousePointer2, Pencil } from "lucide-react";
import {
	type CSSProperties,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";

import type {
	ConceptStatus,
	SkillTreeCategory,
	SkillTreeConcept,
	SkillTreeTechnology,
} from "#/electron/db/types";
import { EditConceptDialog } from "@/ui/components/concepts/edit-concept-dialog";
import { cn } from "@/ui/lib/utils";

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const CATEGORY_SPACING = 1_050;
const ROOT_TECH_GAP = 170;
const CHILD_TECH_GAP = 130;
const CONCEPT_HEIGHT = 32;
const CONCEPTS_PER_RING = 6;
const CONCEPT_POPOVER_DELAY = 1_000;
const CONCEPT_FADE_DURATION = 180;

type Point = {
	x: number;
	y: number;
};

type SubtechnologyColor = {
	/** Border utility for the subtechnology node, e.g. "border-purple-600". */
	border: string;
	/** Light background utility for the subtechnology node, e.g. "bg-purple-50". */
	background: string;
	/** Ring utility for a linked concept's border, e.g. "ring-purple-600". */
	ring: string;
	/** Background utility for a linked concept's dot, e.g. "bg-purple-600". */
	dot: string;
};

type SkillMapNodeData = {
	name: string;
	conceptCount: number;
	status?: ConceptStatus;
	isSubtechnology?: boolean;
	description?: string | null;
	concept?: SkillTreeConcept;
	/** Assigned only to subtechnology nodes and their linked concepts. */
	color?: SubtechnologyColor;
};

type SkillMapNode = Node<SkillMapNodeData>;

type GraphLayout = {
	nodes: SkillMapNode[];
	edges: Edge[];
};

type Bounds = {
	left: number;
	top: number;
	right: number;
	bottom: number;
};

type HandleSide = "top" | "right" | "bottom" | "left";

const statusColor: Record<ConceptStatus, string> = {
	discovered: "bg-muted-foreground/45",
	learning: "bg-chart-4",
	learned: "bg-chart-2",
};

// Static, ordered palette of Tailwind -600 colors used to tell sibling
// subtechnologies apart. rose-600 leads because it is the theme color. The full
// class strings are written out literally so Tailwind's compiler emits them.
// Subtechnologies within a technology are assigned a color by alphabetical name
// order (see assignSubtechnologyColors), so the mapping is stable across reloads.
const SUBTECHNOLOGY_COLORS: readonly SubtechnologyColor[] = [
	{
		border: "border-purple-500",
		background: "bg-purple-50",
		ring: "ring-purple-500",
		dot: "bg-purple-500",
	},
	{
		border: "border-green-500",
		background: "bg-green-50",
		ring: "ring-green-500",
		dot: "bg-green-500",
	},
	{
		border: "border-blue-500",
		background: "bg-blue-50",
		ring: "ring-blue-500",
		dot: "bg-blue-500",
	},
	{
		border: "border-mauve-500",
		background: "bg-mauve-50",
		ring: "ring-mauve-500",
		dot: "bg-mauve-500",
	},
	{
		border: "border-fuchsia-500",
		background: "bg-fuchsia-50",
		ring: "ring-fuchsia-500",
		dot: "bg-fuchsia-500",
	},
	{
		border: "border-slate-500",
		background: "bg-slate-50",
		ring: "ring-slate-500",
		dot: "bg-slate-500",
	},
	{
		border: "border-orange-500",
		background: "bg-orange-50",
		ring: "ring-orange-500",
		dot: "bg-orange-500",
	},
	{
		border: "border-indigo-500",
		background: "bg-indigo-50",
		ring: "ring-indigo-500",
		dot: "bg-indigo-500",
	},
	{
		border: "border-sky-500",
		background: "bg-sky-50",
		ring: "ring-sky-500",
		dot: "bg-sky-500",
	},
	{
		border: "border-amber-500",
		background: "bg-amber-50",
		ring: "ring-amber-500",
		dot: "bg-amber-500",
	},
	{
		border: "border-cyan-500",
		background: "bg-cyan-50",
		ring: "ring-cyan-500",
		dot: "bg-cyan-500",
	},
	{
		border: "border-teal-500",
		background: "bg-teal-50",
		ring: "ring-teal-500",
		dot: "bg-teal-500",
	},
	{
		border: "border-lime-500",
		background: "bg-lime-50",
		ring: "ring-lime-500",
		dot: "bg-lime-500",
	},
];

function clamp(value: number, minimum: number, maximum: number) {
	return Math.min(Math.max(value, minimum), maximum);
}

function pointOnRay(origin: Point, distance: number, angle: number): Point {
	return {
		x: origin.x + Math.cos(angle) * distance,
		y: origin.y + Math.sin(angle) * distance,
	};
}

function nodeAtCenter(
	id: string,
	type: string,
	center: Point,
	width: number,
	height: number,
	data: SkillMapNodeData,
): SkillMapNode {
	return {
		id,
		type,
		position: {
			x: center.x - width / 2,
			y: center.y - height / 2,
		},
		style: { width, height },
		data,
		ariaLabel: `${data.name}${data.conceptCount > 0 ? `, ${data.conceptCount} concepts` : ""}`,
	};
}

function conceptNodeAtCenter(
	id: string,
	center: Point,
	concept: SkillTreeConcept,
	color: SubtechnologyColor | undefined,
): SkillMapNode {
	const estimatedWidth = estimatedConceptWidth(concept.name);

	return {
		id,
		type: "concept",
		position: {
			x: center.x - estimatedWidth / 2,
			y: center.y - CONCEPT_HEIGHT / 2,
		},
		style: { width: "max-content", height: CONCEPT_HEIGHT },
		data: {
			name: concept.name,
			conceptCount: 0,
			status: concept.status,
			description: concept.description,
			concept,
			color,
		},
		ariaLabel: concept.name,
	};
}

function estimatedConceptWidth(name: string) {
	return 66 + Array.from(name).length * 6.4;
}

function handleSides(
	source: Point,
	target: Point,
): {
	source: HandleSide;
	target: HandleSide;
} {
	const dx = target.x - source.x;
	const dy = target.y - source.y;

	if (Math.abs(dx) >= Math.abs(dy)) {
		return dx >= 0
			? { source: "right", target: "left" }
			: { source: "left", target: "right" };
	}

	return dy >= 0
		? { source: "bottom", target: "top" }
		: { source: "top", target: "bottom" };
}

function graphEdge(
	id: string,
	sourceId: string,
	targetId: string,
	sourceCenter: Point,
	targetCenter: Point,
	kind: "category" | "technology" | "concept",
): Edge {
	const sides = handleSides(sourceCenter, targetCenter);
	const isCategory = kind === "category";
	const isConcept = kind === "concept";

	return {
		id,
		source: sourceId,
		target: targetId,
		sourceHandle: `source-${sides.source}`,
		targetHandle: `target-${sides.target}`,
		type: "default",
		zIndex: 0,
		style: {
			stroke: isCategory ? "var(--chart-3)" : "var(--muted-foreground)",
			strokeWidth: isCategory ? 2.25 : isConcept ? 1.35 : 1.5,
			strokeOpacity: isCategory ? 0.65 : isConcept ? 0.48 : 0.42,
			strokeDasharray: isConcept ? "5 5" : undefined,
		},
		markerEnd: isConcept
			? undefined
			: {
					type: MarkerType.ArrowClosed,
					color: isCategory ? "var(--chart-3)" : "var(--muted-foreground)",
					width: 13,
					height: 13,
				},
	};
}

function uniqueTechnologyConceptCount(technology: SkillTreeTechnology): number {
	const ids = new Set(technology.concepts.map((concept) => concept.id));

	const collect = (children: SkillTreeTechnology[]) => {
		for (const child of children) {
			for (const concept of child.concepts) ids.add(concept.id);
			collect(child.children ?? []);
		}
	};

	collect(technology.children ?? []);
	return ids.size;
}

function uniqueCategoryConceptCount(category: SkillTreeCategory): number {
	const ids = new Set(category.concepts.map((concept) => concept.id));

	const collect = (technology: SkillTreeTechnology) => {
		for (const concept of technology.concepts) ids.add(concept.id);
		for (const child of technology.children ?? []) collect(child);
	};

	for (const technology of category.technologies) collect(technology);
	return ids.size;
}

function categoryTechnologyRoots(
	category: SkillTreeCategory,
): SkillTreeTechnology[] {
	const nestedIds = new Set<string>();

	const collectNested = (technology: SkillTreeTechnology) => {
		for (const child of technology.children ?? []) {
			nestedIds.add(child.id);
			collectNested(child);
		}
	};

	for (const technology of category.technologies) collectNested(technology);

	const seen = new Set<string>();
	return category.technologies.filter((technology) => {
		if (nestedIds.has(technology.id) || seen.has(technology.id)) return false;
		seen.add(technology.id);
		return true;
	});
}

// Maps each subtechnology id to a stable color. Colors are scoped per root
// technology: within one technology tree, all descendant subtechnologies are
// sorted by name and assigned palette colors in order, so siblings always
// differ and the same tree always looks the same. Root (non-sub) technologies
// are absent from the map and fall back to the theme color.
function assignSubtechnologyColors(
	categories: SkillTreeCategory[],
): Map<string, SubtechnologyColor> {
	const colors = new Map<string, SubtechnologyColor>();

	const collectDescendants = (
		technology: SkillTreeTechnology,
		into: SkillTreeTechnology[],
	) => {
		for (const child of technology.children ?? []) {
			into.push(child);
			collectDescendants(child, into);
		}
	};

	for (const category of categories) {
		for (const root of categoryTechnologyRoots(category)) {
			const subtechnologies: SkillTreeTechnology[] = [];
			collectDescendants(root, subtechnologies);

			subtechnologies
				.sort((first, second) => first.name.localeCompare(second.name))
				.forEach((subtechnology, index) => {
					colors.set(
						subtechnology.id,
						SUBTECHNOLOGY_COLORS[index % SUBTECHNOLOGY_COLORS.length],
					);
				});
		}
	}

	return colors;
}

function categoryDiameter(conceptCount: number) {
	return clamp(144 + Math.sqrt(conceptCount) * 24, 144, 230);
}

function technologyDiameter(
	conceptCount: number,
	isSubtechnology: boolean,
	name: string,
) {
	const base = isSubtechnology ? 132 : 148;
	const maximum = isSubtechnology ? 202 : 220;
	const nameBoost = clamp((name.length - 14) * 1.35, 0, 34);
	return clamp(base + Math.sqrt(conceptCount) * 20 + nameBoost, base, maximum);
}

function categoryCenter(index: number): Point {
	if (index === 0) return { x: 0, y: 0 };

	const radius = CATEGORY_SPACING * Math.sqrt(index);
	const angle = index * GOLDEN_ANGLE - Math.PI / 2;
	return pointOnRay({ x: 0, y: 0 }, radius, angle);
}

function addConceptOrbit({
	concepts,
	parentId,
	parentCenter,
	parentRadius,
	outwardAngle,
	idPrefix,
	color,
	nodes,
	edges,
}: {
	concepts: SkillTreeConcept[];
	parentId: string;
	parentCenter: Point;
	parentRadius: number;
	outwardAngle: number;
	idPrefix: string;
	/** Color inherited from a subtechnology parent; undefined otherwise. */
	color: SubtechnologyColor | undefined;
	nodes: SkillMapNode[];
	edges: Edge[];
}) {
	for (const [index, concept] of concepts.entries()) {
		const ring = Math.floor(index / CONCEPTS_PER_RING);
		const indexInRing = index % CONCEPTS_PER_RING;
		const itemsInRing = Math.min(
			CONCEPTS_PER_RING,
			concepts.length - ring * CONCEPTS_PER_RING,
		);
		const spread =
			itemsInRing === 1 ? 0 : Math.min(Math.PI * 1.15, itemsInRing * 0.42);
		const angle =
			itemsInRing === 1
				? outwardAngle
				: outwardAngle -
					spread / 2 +
					(indexInRing / (itemsInRing - 1)) * spread;
		const distance = parentRadius + 88 + ring * 58;
		const center = pointOnRay(parentCenter, distance, angle);
		const id = `${idPrefix}:concept:${concept.id}:${index}`;

		nodes.push(conceptNodeAtCenter(id, center, concept, color));
		edges.push(
			graphEdge(
				`${parentId}->${id}`,
				parentId,
				id,
				parentCenter,
				center,
				"concept",
			),
		);
	}
}

function addTechnologyBranch({
	categoryId,
	technology,
	parentId,
	parentCenter,
	parentRadius,
	angle,
	depth,
	path,
	colors,
	nodes,
	edges,
}: {
	categoryId: string;
	technology: SkillTreeTechnology;
	parentId: string;
	parentCenter: Point;
	parentRadius: number;
	angle: number;
	depth: number;
	path: string;
	colors: Map<string, SubtechnologyColor>;
	nodes: SkillMapNode[];
	edges: Edge[];
}) {
	const isSubtechnology = depth > 0;
	const color = isSubtechnology ? colors.get(technology.id) : undefined;
	const conceptCount = uniqueTechnologyConceptCount(technology);
	const diameter = technologyDiameter(
		conceptCount,
		isSubtechnology,
		technology.name,
	);
	const radius = diameter / 2;
	const distance =
		parentRadius + radius + (isSubtechnology ? CHILD_TECH_GAP : ROOT_TECH_GAP);
	const center = pointOnRay(parentCenter, distance, angle);
	const id = `${categoryId}:technology:${path}:${technology.id}`;

	nodes.push(
		nodeAtCenter(id, "technology", center, diameter, diameter, {
			name: technology.name,
			conceptCount,
			isSubtechnology,
			color,
		}),
	);
	edges.push(
		graphEdge(
			`${parentId}->${id}`,
			parentId,
			id,
			parentCenter,
			center,
			depth === 0 ? "category" : "technology",
		),
	);

	const children = technology.children ?? [];
	const childSpread = Math.min(
		Math.PI * 0.8,
		Math.max(0.62, children.length * 0.55),
	);

	for (const [index, child] of children.entries()) {
		const childAngle =
			children.length === 1
				? angle
				: angle -
					childSpread / 2 +
					(index / (children.length - 1)) * childSpread;
		addTechnologyBranch({
			categoryId,
			technology: child,
			parentId: id,
			parentCenter: center,
			parentRadius: radius,
			angle: childAngle,
			depth: depth + 1,
			path: `${path}.${index}`,
			colors,
			nodes,
			edges,
		});
	}

	addConceptOrbit({
		concepts: technology.concepts,
		parentId: id,
		parentCenter: center,
		parentRadius: radius,
		outwardAngle: children.length > 0 ? angle + Math.PI / 2 : angle,
		idPrefix: id,
		color,
		nodes,
		edges,
	});
}

function layoutCategory(
	category: SkillTreeCategory,
	index: number,
	colors: Map<string, SubtechnologyColor>,
	nodes: SkillMapNode[],
	edges: Edge[],
) {
	const center = categoryCenter(index);
	const conceptCount = uniqueCategoryConceptCount(category);
	const diameter = categoryDiameter(conceptCount);
	const radius = diameter / 2;
	const categoryId = `${category.id}:category`;
	const roots = categoryTechnologyRoots(category);
	const rotation = index * 0.77 - Math.PI / 2;

	nodes.push(
		nodeAtCenter(categoryId, "category", center, diameter, diameter, {
			name: category.name,
			conceptCount,
		}),
	);

	for (const [rootIndex, technology] of roots.entries()) {
		const angle =
			roots.length === 1
				? rotation
				: rotation + (rootIndex / roots.length) * Math.PI * 2;
		addTechnologyBranch({
			categoryId: category.id,
			technology,
			parentId: categoryId,
			parentCenter: center,
			parentRadius: radius,
			angle,
			depth: 0,
			path: `${rootIndex}`,
			colors,
			nodes,
			edges,
		});
	}

	const directConceptAngle =
		roots.length > 0
			? rotation + Math.PI / Math.max(roots.length, 2)
			: rotation;
	addConceptOrbit({
		concepts: category.concepts,
		parentId: categoryId,
		parentCenter: center,
		parentRadius: radius,
		outwardAngle: directConceptAngle,
		idPrefix: categoryId,
		color: undefined,
		nodes,
		edges,
	});
}

function nodeDimensions(node: SkillMapNode) {
	const width =
		node.type === "concept"
			? estimatedConceptWidth(node.data.name)
			: typeof node.style?.width === "number"
				? node.style.width
				: 0;
	const height =
		typeof node.style?.height === "number" ? node.style.height : CONCEPT_HEIGHT;

	return { width, height };
}

function nodeCenter(node: SkillMapNode): Point {
	const { width, height } = nodeDimensions(node);
	return {
		x: node.position.x + width / 2,
		y: node.position.y + height / 2,
	};
}

function nodeBounds(node: SkillMapNode, padding: number): Bounds {
	const { width, height } = nodeDimensions(node);
	return {
		left: node.position.x - padding,
		top: node.position.y - padding,
		right: node.position.x + width + padding,
		bottom: node.position.y + height + padding,
	};
}

function boundsOverlap(first: Bounds, second: Bounds) {
	return (
		first.left < second.right &&
		first.right > second.left &&
		first.top < second.bottom &&
		first.bottom > second.top
	);
}

function stableAngle(id: string) {
	let hash = 0;
	for (const character of id) {
		hash = (hash * 31 + character.charCodeAt(0)) | 0;
	}
	return (Math.abs(hash) % 360) * (Math.PI / 180);
}

function resolveConceptCollisions(nodes: SkillMapNode[]): SkillMapNode[] {
	const occupied = nodes
		.filter((node) => node.type !== "concept")
		.map((node) => nodeBounds(node, 20));

	return nodes.map((node) => {
		if (node.type !== "concept") return node;

		const originalCenter = nodeCenter(node);
		const { width, height } = nodeDimensions(node);
		const startingAngle = stableAngle(node.id);
		let resolvedPosition = node.position;

		for (let attempt = 0; attempt < 360; attempt += 1) {
			const distance = attempt === 0 ? 0 : 22 * Math.sqrt(attempt);
			const angle = startingAngle + attempt * GOLDEN_ANGLE;
			const center = pointOnRay(originalCenter, distance, angle);
			const candidate: SkillMapNode = {
				...node,
				position: {
					x: center.x - width / 2,
					y: center.y - height / 2,
				},
			};
			const candidateBounds = nodeBounds(candidate, 8);

			if (!occupied.some((bounds) => boundsOverlap(candidateBounds, bounds))) {
				resolvedPosition = candidate.position;
				occupied.push(candidateBounds);
				break;
			}
		}

		return { ...node, position: resolvedPosition };
	});
}

function alignEdgeHandles(edges: Edge[], nodes: SkillMapNode[]): Edge[] {
	const centers = new Map(nodes.map((node) => [node.id, nodeCenter(node)]));

	return edges.map((edge) => {
		const source = centers.get(edge.source);
		const target = centers.get(edge.target);
		if (!source || !target) return edge;

		const sides = handleSides(source, target);
		return {
			...edge,
			sourceHandle: `source-${sides.source}`,
			targetHandle: `target-${sides.target}`,
		};
	});
}

function buildGraphLayout(categories: SkillTreeCategory[]): GraphLayout {
	const nodes: SkillMapNode[] = [];
	const edges: Edge[] = [];
	const colors = assignSubtechnologyColors(categories);

	for (const [index, category] of categories.entries()) {
		layoutCategory(category, index, colors, nodes, edges);
	}

	const resolvedNodes = resolveConceptCollisions(nodes);
	return {
		nodes: resolvedNodes,
		edges: alignEdgeHandles(edges, resolvedNodes),
	};
}

function linkedConceptsByNode(
	nodes: SkillMapNode[],
	edges: Edge[],
): Map<string, Set<string>> {
	const nodeById = new Map(nodes.map((node) => [node.id, node]));
	const childrenById = new Map<string, string[]>();

	for (const edge of edges) {
		const children = childrenById.get(edge.source) ?? [];
		children.push(edge.target);
		childrenById.set(edge.source, children);
	}

	const linkedConcepts = new Map<string, Set<string>>();

	for (const node of nodes) {
		if (node.type === "concept") continue;

		const concepts = new Set<string>();
		const visited = new Set<string>();
		const pending = [...(childrenById.get(node.id) ?? [])];

		while (pending.length > 0) {
			const childId = pending.pop();
			if (!childId || visited.has(childId)) continue;
			visited.add(childId);

			const child = nodeById.get(childId);
			if (child?.type === "concept") {
				concepts.add(childId);
				continue;
			}

			pending.push(...(childrenById.get(childId) ?? []));
		}

		linkedConcepts.set(node.id, concepts);
	}

	return linkedConcepts;
}

function NodeHandles() {
	const sides = [
		["top", Position.Top],
		["right", Position.Right],
		["bottom", Position.Bottom],
		["left", Position.Left],
	] as const;

	return sides.flatMap(([side, position]) => [
		<Handle
			key={`target-${side}`}
			id={`target-${side}`}
			type="target"
			position={position}
			isConnectable={false}
			className="!size-1 !border-0 !bg-transparent"
		/>,
		<Handle
			key={`source-${side}`}
			id={`source-${side}`}
			type="source"
			position={position}
			isConnectable={false}
			className="!size-1 !border-0 !bg-transparent"
		/>,
	]);
}

function CategoryNode({ data }: NodeProps<SkillMapNode>) {
	return (
		<div className="relative flex size-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-full border border-chart-5/40 bg-gradient-to-br from-chart-2 via-brand to-chart-4 px-5 text-center text-brand-foreground shadow-[0_24px_55px_-28px_var(--brand)] ring-8 ring-chart-1/15">
			<div className="absolute -top-1/3 -left-1/4 size-3/4 rounded-full bg-white/15 blur-xl" />
			<p className="relative font-heading text-[10px] font-semibold tracking-[0.2em] uppercase opacity-70">
				Category
			</p>
			<p className="relative mt-1 max-w-full text-base leading-tight font-semibold">
				{data.name}
			</p>
			<p className="relative mt-2 text-[10px] font-medium tabular-nums opacity-75">
				{data.conceptCount} {data.conceptCount === 1 ? "concept" : "concepts"}
			</p>
			<NodeHandles />
		</div>
	);
}

function TechnologyNode({ data }: NodeProps<SkillMapNode>) {
	return (
		<div
			className={cn(
				"relative flex size-full cursor-pointer flex-col items-center justify-center rounded-full border px-4 text-center shadow-[0_18px_42px_-30px_var(--foreground)] backdrop-blur-sm",
				data.isSubtechnology
					? "bg-chart-1/20 ring-4 ring-chart-1/10"
					: "border-2 border-rose-500 bg-card/95 ring-6 ring-chart-1/12",
				data.isSubtechnology &&
					(data.color
						? cn("border-2", data.color.border, data.color.background)
						: "border-chart-2/35"),
			)}
		>
			<div
				className={cn(
					"mb-1.5 flex size-7 items-center justify-center rounded-full",
					data.isSubtechnology
						? "bg-chart-2/15 text-chart-5"
						: "bg-chart-1/35 text-chart-5",
				)}
			>
				<Layers3 className="size-3.5" />
			</div>
			<p className="max-w-full text-[9px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
				{data.isSubtechnology ? "Subtechnology" : "Technology"}
			</p>
			<p className="mt-1 max-w-full break-words text-sm leading-tight font-semibold">
				{data.name}
			</p>
			{data.conceptCount > 0 && (
				<p className="mt-1.5 text-[10px] text-muted-foreground tabular-nums">
					{data.conceptCount} linked
				</p>
			)}
			<NodeHandles />
		</div>
	);
}

function ConceptNode({ data }: NodeProps<SkillMapNode>) {
	const status = data.status ?? "discovered";
	const conceptRef = useRef<HTMLDivElement>(null);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [anchor, setAnchor] = useState<DOMRect | null>(null);
	const [editing, setEditing] = useState(false);

	const hideDescription = () => {
		if (timerRef.current) clearTimeout(timerRef.current);
		timerRef.current = null;
		setAnchor(null);
	};

	const scheduleDescription = () => {
		if (!data.description) return;
		if (timerRef.current) clearTimeout(timerRef.current);
		timerRef.current = setTimeout(() => {
			const bounds = conceptRef.current?.getBoundingClientRect();
			if (bounds) setAnchor(bounds);
			timerRef.current = null;
		}, CONCEPT_POPOVER_DELAY);
	};

	useEffect(
		() => () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		},
		[],
	);

	const popoverStyle = useMemo<CSSProperties>(() => {
		if (!anchor) return {};

		const width = 340;
		const margin = 12;
		const opensAbove =
			window.innerHeight - anchor.bottom < 220 && anchor.top > 220;

		return {
			left: clamp(
				anchor.left + anchor.width / 2 - width / 2,
				margin,
				window.innerWidth - width - margin,
			),
			top: opensAbove ? undefined : anchor.bottom + 10,
			bottom: opensAbove ? window.innerHeight - anchor.top + 10 : undefined,
			width,
		};
	}, [anchor]);

	return (
		<>
			<div
				ref={conceptRef}
				onPointerEnter={scheduleDescription}
				onPointerLeave={hideDescription}
				onPointerDown={hideDescription}
				className="relative flex h-full w-max items-center gap-2 rounded-full bg-background/78 px-3 text-foreground shadow-[0_8px_24px_-18px_var(--foreground)] ring-1 ring-slate-200 backdrop-blur-sm"
			>
				<span
					className={cn(
						"size-2 shrink-0 rounded-full",
						data.color ? data.color.dot : statusColor[status],
					)}
				/>
				<span className="whitespace-nowrap text-xs font-medium">
					{data.name}
				</span>
				{data.concept && (
					<button
						type="button"
						onPointerDown={(event) => {
							event.stopPropagation();
							hideDescription();
						}}
						onClick={(event) => {
							event.stopPropagation();
							setEditing(true);
						}}
						aria-label={`Edit ${data.name}`}
						title="Edit concept"
						className="nodrag nopan text-muted-foreground/70 hover:text-foreground shrink-0 rounded-sm transition-colors"
					>
						<Pencil className="size-4" />
					</button>
				)}
				<NodeHandles />
			</div>
			{anchor &&
				data.description &&
				createPortal(
					<div
						role="tooltip"
						style={popoverStyle}
						className="animate-in fade-in zoom-in-95 pointer-events-none fixed z-100 rounded-2xl border bg-popover/96 p-4 text-popover-foreground shadow-xl backdrop-blur-md duration-150"
					>
						<p className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
							Concept notes
						</p>
						<p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed">
							{data.description}
						</p>
					</div>,
					document.body,
				)}
			{data.concept && (
				<EditConceptDialog
					concept={data.concept}
					open={editing}
					onOpenChange={setEditing}
				/>
			)}
		</>
	);
}

const nodeTypes = {
	category: CategoryNode,
	technology: TechnologyNode,
	concept: ConceptNode,
} satisfies NodeTypes;

function Legend() {
	return (
		<div className="pointer-events-none flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border bg-background/88 px-3.5 py-2.5 text-[11px] text-muted-foreground shadow-sm backdrop-blur-md">
			<span className="flex items-center gap-1.5">
				<span className="size-3 rounded-full bg-brand ring-2 ring-chart-1/30" />
				Category island
			</span>
			<span className="flex items-center gap-1.5">
				<span className="size-3 rounded-full bg-card ring-1 ring-chart-2/50" />
				Technology
			</span>
			<span className="flex items-center gap-1.5">
				<span className="size-2.5 rounded-full bg-muted-foreground/45" />
				Concept
			</span>
			<span className="hidden items-center gap-1.5 border-l pl-4 sm:flex">
				<MousePointer2 className="size-3" />
				Drag to move · scroll to zoom
			</span>
		</div>
	);
}

function CategoryPicker({
	categories,
	selectedId,
	onSelect,
}: {
	categories: SkillTreeCategory[];
	selectedId: string | null;
	onSelect: (id: string) => void;
}) {
	return (
		<div className="pointer-events-auto flex max-w-full flex-wrap items-center gap-1 rounded-xl border bg-background/88 p-1.5 shadow-sm backdrop-blur-md">
			<span className="px-2 text-[10px] font-semibold tracking-[0.15em] text-muted-foreground uppercase">
				Categories
			</span>
			{categories.map((category) => (
				<button
					key={category.id}
					type="button"
					onPointerDown={(event) => {
						event.stopPropagation();
					}}
					onClick={(event) => {
						event.stopPropagation();
						onSelect(category.id);
					}}
					className={cn(
						"nodrag nopan rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors",
						selectedId === category.id
							? "bg-brand text-brand-foreground"
							: "text-muted-foreground hover:bg-muted hover:text-foreground",
					)}
				>
					{category.name}
				</button>
			))}
		</div>
	);
}

export function SkillMap({ categories }: { categories: SkillTreeCategory[] }) {
	const layout = useMemo(() => buildGraphLayout(categories), [categories]);
	const [nodes, setNodes, onNodesChange] = useNodesState(layout.nodes);
	const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(
		() => new Set(),
	);
	const flowInstance = useRef<ReactFlowInstance<SkillMapNode, Edge> | null>(
		null,
	);
	const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
		null,
	);

	useEffect(() => {
		setNodes(layout.nodes);
	}, [layout.nodes, setNodes]);

	const linkedConcepts = useMemo(
		() => linkedConceptsByNode(layout.nodes, layout.edges),
		[layout.edges, layout.nodes],
	);
	const hiddenConceptIds = useMemo(() => {
		const hidden = new Set<string>();

		for (const nodeId of collapsedNodeIds) {
			for (const conceptId of linkedConcepts.get(nodeId) ?? []) {
				hidden.add(conceptId);
			}
		}

		return hidden;
	}, [collapsedNodeIds, linkedConcepts]);
	const visibleNodes = useMemo<SkillMapNode[]>(
		() =>
			nodes.map((node) => {
				if (node.type !== "concept") return node;

				const isHidden = hiddenConceptIds.has(node.id);
				return {
					...node,
					style: {
						...node.style,
						opacity: isHidden ? 0 : 1,
						pointerEvents: isHidden ? "none" : "auto",
						transition: `opacity ${CONCEPT_FADE_DURATION}ms ease`,
					},
				};
			}),
		[hiddenConceptIds, nodes],
	);
	const visibleEdges = useMemo<Edge[]>(
		() =>
			layout.edges.map((edge) => ({
				...edge,
				style: {
					...edge.style,
					opacity: hiddenConceptIds.has(edge.target) ? 0 : 1,
					transition: `opacity ${CONCEPT_FADE_DURATION}ms ease`,
				},
			})),
		[hiddenConceptIds, layout.edges],
	);

	const toggleLinkedConcepts = (node: SkillMapNode) => {
		if (node.type === "concept") return;

		setCollapsedNodeIds((current) => {
			const next = new Set(current);
			if (next.has(node.id)) next.delete(node.id);
			else next.add(node.id);
			return next;
		});
	};

	const focusCategory = (categoryId: string) => {
		setSelectedCategoryId(categoryId);
		const instance = flowInstance.current;
		if (!instance) return;

		const categoryNode = instance.getNode(`${categoryId}:category`);
		if (!categoryNode) return;
		const center = nodeCenter(categoryNode);

		void instance.setCenter(center.x, center.y, {
			zoom: 0.85,
			duration: 700,
		});
	};

	if (categories.length === 0) {
		return (
			<div className="flex min-h-[620px] items-center justify-center rounded-3xl border border-dashed text-center">
				<div>
					<MapIcon className="mx-auto size-8 text-muted-foreground/50" />
					<p className="mt-3 text-sm font-medium">No categories yet</p>
					<p className="mt-1 text-xs text-muted-foreground">
						Add a category to start growing your skill map.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="relative h-[calc(100vh-12rem)] min-h-[620px] overflow-hidden rounded-3xl border bg-[radial-gradient(circle_at_center,var(--card),var(--muted))] shadow-sm">
			<ReactFlow
				nodes={visibleNodes}
				edges={visibleEdges}
				nodeTypes={nodeTypes}
				onNodesChange={onNodesChange}
				onNodeClick={(_, node) => {
					toggleLinkedConcepts(node);
				}}
				onInit={(instance) => {
					flowInstance.current = instance;
				}}
				minZoom={0.08}
				maxZoom={2.5}
				fitView
				fitViewOptions={{ padding: 0.14, maxZoom: 0.72 }}
				panOnDrag
				zoomOnPinch
				zoomOnScroll
				zoomOnDoubleClick={false}
				nodesConnectable={false}
				deleteKeyCode={null}
				proOptions={{ hideAttribution: true }}
			>
				<Background
					variant={BackgroundVariant.Dots}
					gap={30}
					size={1.15}
					color="color-mix(in oklch, var(--muted-foreground) 20%, transparent)"
				/>
				<Panel
					position="top-left"
					style={{ maxWidth: "calc(100vw - 6rem)" }}
					className="flex flex-col items-start gap-2"
				>
					<Legend />
					<CategoryPicker
						categories={categories}
						selectedId={selectedCategoryId}
						onSelect={focusCategory}
					/>
				</Panel>
				<Controls
					position="bottom-left"
					showInteractive={false}
					className="!overflow-hidden !rounded-xl !border !bg-background/90 !shadow-sm"
				/>
				<MiniMap
					position="bottom-right"
					pannable
					zoomable
					nodeColor={(node) => {
						if (node.type === "category") return "var(--brand)";
						if (node.type === "technology") return "var(--chart-1)";
						return "var(--muted-foreground)";
					}}
					nodeStrokeColor="var(--border)"
					maskColor="color-mix(in oklch, var(--background) 72%, transparent)"
					className="!overflow-hidden !rounded-xl !border !bg-background/90 !shadow-sm"
				/>
			</ReactFlow>
		</div>
	);
}
