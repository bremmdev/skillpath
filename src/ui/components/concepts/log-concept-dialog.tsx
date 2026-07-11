import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

import type {
	ConceptLink,
	ConceptStatus,
	CreateConceptInput,
	SkillTreeCategory,
	SkillTreeTechnology,
} from "#/electron/db/types";
import {
	ImportanceChips,
	ipcErrorMessage,
	NameField,
	NotesField,
	StatusChips,
} from "@/ui/components/concepts/concept-fields";
import { Button } from "@/ui/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/ui/components/ui/dialog";
import { Input } from "@/ui/components/ui/input";
import { Label } from "@/ui/components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/ui/components/ui/select";
import { skillTreeQueryOptions } from "@/ui/lib/query";

type LinkOption = { value: string; label: string };

/**
 * Flattens the skill tree into the "belongs to" picker's options. The tree
 * repeats a technology wherever it appears (nested under its parent and at the
 * top of every linked category), so technologies are deduped by their
 * namespaced id ("tech-3"); those ids double as option values and are parsed
 * back into a ConceptLink on submit.
 */
function buildLinkOptions(tree: SkillTreeCategory[]): {
	technologies: LinkOption[];
	categories: LinkOption[];
} {
	const techById = new Map<string, string>();
	const walk = (tech: SkillTreeTechnology) => {
		techById.set(tech.id, tech.name);
		for (const child of tech.children ?? []) walk(child);
	};
	for (const category of tree) category.technologies.forEach(walk);

	return {
		technologies: [...techById]
			.map(([value, label]) => ({ value, label }))
			.sort((a, b) => a.label.localeCompare(b.label)),
		// The query behind the tree already orders categories by name.
		categories: tree.map((c) => ({ value: c.id, label: c.name })),
	};
}

// The narrow return type (not ConceptLink) lets the result double as a
// NewTechnologyParent when picking where a new technology nests.
function parseLink(
	value: string,
): { type: "technology" | "category"; id: number } | null {
	const match = value.match(/^(tech|cat)-(\d+)$/);
	if (!match) return null;
	return {
		type: match[1] === "tech" ? "technology" : "category",
		id: Number(match[2]),
	};
}

// Sentinel value for the "nest under" select: create the parent too.
const NEW_PARENT = "new-parent";

function LinkOptionGroup({
	label,
	options,
}: {
	label: string;
	options: LinkOption[];
}) {
	return (
		<SelectGroup>
			<SelectLabel>{label}</SelectLabel>
			{options.map((option) => (
				<SelectItem key={option.value} value={option.value}>
					{option.label}
				</SelectItem>
			))}
		</SelectGroup>
	);
}

function LogConceptForm({ onLogged }: { onLogged: () => void }) {
	const queryClient = useQueryClient();
	// Mounted only while the dialog is open, so the tree is fetched (or read
	// from the cache primed by /browse) on first open, not at app start.
	const skillTree = useQuery(skillTreeQueryOptions);

	const [name, setName] = useState("");
	const [linkValue, setLinkValue] = useState<string | null>(null);
	// "existing" links to something already in the tree; "new" creates a
	// technology (and optionally its parent) along with the concept. Both
	// modes keep their state when toggling, only the active one is submitted.
	const [linkMode, setLinkMode] = useState<"existing" | "new">("existing");
	const [newTechName, setNewTechName] = useState("");
	const [newTechUnder, setNewTechUnder] = useState<string | null>(null);
	const [newParentName, setNewParentName] = useState("");
	const [newParentCategory, setNewParentCategory] = useState<string | null>(
		null,
	);
	const [status, setStatus] = useState<ConceptStatus>("learned");
	const [importance, setImportance] = useState(2);
	const [description, setDescription] = useState("");

	const options = useMemo(
		() =>
			skillTree.data
				? buildLinkOptions(skillTree.data)
				: { technologies: [], categories: [] },
		[skillTree.data],
	);
	// Handed to Select so the trigger shows the picked name, not the raw id.
	const items = useMemo(
		() => [...options.technologies, ...options.categories],
		[options],
	);
	const nestItems = useMemo(
		() => [...items, { value: NEW_PARENT, label: "New parent technology…" }],
		[items],
	);

	const mutation = useMutation({
		mutationFn: (input: CreateConceptInput) =>
			window.api.concepts.create(input),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: skillTreeQueryOptions.queryKey,
			});
			// Prefix key: refreshes both dashboard stats and the recently-learned list.
			queryClient.invalidateQueries({ queryKey: ["dashboard"] });
			onLogged();
		},
	});

	// null while the active mode's fields are incomplete, which keeps submit
	// disabled — so no per-field validation messages are needed.
	const buildNewTechLink = (): ConceptLink | null => {
		const techName = newTechName.trim();
		if (techName === "" || newTechUnder === null) return null;

		if (newTechUnder === NEW_PARENT) {
			const parentName = newParentName.trim();
			const category =
				newParentCategory === null ? null : parseLink(newParentCategory);
			if (parentName === "" || category?.type !== "category") return null;
			return {
				type: "newTechnology",
				technology: {
					name: techName,
					parent: {
						type: "newTechnology",
						name: parentName,
						categoryId: category.id,
					},
				},
			};
		}

		const parent = parseLink(newTechUnder);
		if (parent === null) return null;
		return { type: "newTechnology", technology: { name: techName, parent } };
	};

	const link =
		linkMode === "existing"
			? linkValue === null
				? null
				: parseLink(linkValue)
			: buildNewTechLink();
	const canSubmit = name.trim() !== "" && link !== null && !mutation.isPending;

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		if (!canSubmit || link === null) return;
		mutation.mutate({
			name,
			description: description.trim() || undefined,
			status,
			importance,
			link,
		});
	};

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-5">
			<NameField value={name} onChange={setName} />

			<div className="flex flex-col gap-2">
				<div className="flex items-center justify-between">
					<Label
						htmlFor={linkMode === "existing" ? "concept-link" : "new-tech-name"}
					>
						Belongs to
					</Label>
					<button
						type="button"
						onClick={() =>
							setLinkMode(linkMode === "existing" ? "new" : "existing")
						}
						className="text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
					>
						{linkMode === "existing"
							? "+ New technology"
							: "Pick existing instead"}
					</button>
				</div>
				{skillTree.isError ? (
					<p className="text-destructive text-sm">
						Couldn't load technologies and categories: {skillTree.error.message}
					</p>
				) : linkMode === "existing" ? (
					<Select
						items={items}
						value={linkValue}
						onValueChange={setLinkValue}
						disabled={skillTree.isPending}
					>
						<SelectTrigger id="concept-link" className="w-full">
							<SelectValue
								placeholder={
									skillTree.isPending
										? "Loading…"
										: "Pick a technology or category"
								}
							/>
						</SelectTrigger>
						<SelectContent
							alignItemWithTrigger={false}
							collisionAvoidance={{ side: "none" }}
						>
							<LinkOptionGroup
								label="Technologies"
								options={options.technologies}
							/>
							<LinkOptionGroup
								label="Categories"
								options={options.categories}
							/>
						</SelectContent>
					</Select>
				) : (
					<div className="border-border flex flex-col gap-4 border p-3">
						<div className="flex flex-col gap-2">
							<Label htmlFor="new-tech-name">Technology name</Label>
							<Input
								id="new-tech-name"
								value={newTechName}
								onChange={(event) => setNewTechName(event.target.value)}
								placeholder="e.g. IAM"
								required
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor="new-tech-under">Nest under</Label>
							<Select
								items={nestItems}
								value={newTechUnder}
								onValueChange={setNewTechUnder}
								disabled={skillTree.isPending}
							>
								<SelectTrigger id="new-tech-under" className="w-full">
									<SelectValue
										placeholder={
											skillTree.isPending
												? "Loading…"
												: "Pick a parent technology or category"
										}
									/>
								</SelectTrigger>
								<SelectContent
									alignItemWithTrigger={false}
									collisionAvoidance={{ side: "none" }}
								>
									<LinkOptionGroup
										label="Technologies"
										options={options.technologies}
									/>
									<LinkOptionGroup
										label="Categories"
										options={options.categories}
									/>
									<SelectGroup>
										<SelectItem value={NEW_PARENT}>
											<Plus />
											New parent technology…
										</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>
						{newTechUnder === NEW_PARENT && (
							<>
								<div className="flex flex-col gap-2">
									<Label htmlFor="new-parent-name">Parent name</Label>
									<Input
										id="new-parent-name"
										value={newParentName}
										onChange={(event) => setNewParentName(event.target.value)}
										placeholder="e.g. AWS"
										required
									/>
								</div>
								<div className="flex flex-col gap-2">
									<Label htmlFor="new-parent-category">Parent's category</Label>
									<Select
										items={options.categories}
										value={newParentCategory}
										onValueChange={setNewParentCategory}
									>
										<SelectTrigger id="new-parent-category" className="w-full">
											<SelectValue placeholder="Pick a category" />
										</SelectTrigger>
										<SelectContent
											alignItemWithTrigger={false}
											collisionAvoidance={{ side: "none" }}
										>
											<LinkOptionGroup
												label="Categories"
												options={options.categories}
											/>
										</SelectContent>
									</Select>
								</div>
							</>
						)}
					</div>
				)}
			</div>

			<StatusChips value={status} onChange={setStatus} />

			<ImportanceChips value={importance} onChange={setImportance} />

			<NotesField value={description} onChange={setDescription} />

			{mutation.isError && (
				<p className="text-destructive text-sm">
					{ipcErrorMessage(mutation.error)}
				</p>
			)}

			<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
				<DialogClose render={<Button variant="ghost" size="sm" />}>
					Cancel
				</DialogClose>
				<Button type="submit" size="sm" disabled={!canSubmit}>
					{mutation.isPending ? "Logging…" : "Log concept"}
				</Button>
			</div>
		</form>
	);
}

export function LogConceptDialog() {
	const [open, setOpen] = useState(false);
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger render={<Button size="sm" className="h-9 gap-1.5 px-3" />}>
				<Plus className="size-4" />
				Log concept
			</DialogTrigger>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Log concept</DialogTitle>
					<DialogDescription>
						Record something you've learned and attach it to a technology or
						category.
					</DialogDescription>
				</DialogHeader>
				{/* The form (and its mutation state) unmounts with the dialog, so
				    closing always resets it. */}
				<LogConceptForm onLogged={() => setOpen(false)} />
			</DialogContent>
		</Dialog>
	);
}
