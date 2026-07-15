import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import type {
	ConceptStatus,
	SkillTreeCategory,
	SkillTreeTechnology,
	UpdateConceptInput,
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
} from "@/ui/components/ui/dialog";
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
import type { BrowseConcept } from "@/ui/data/browse";
import { skillTreeQueryOptions } from "@/ui/lib/query";

type LinkOption = { value: string; label: string };

function buildLinkOptions(tree: SkillTreeCategory[]): {
	technologies: LinkOption[];
	categories: LinkOption[];
} {
	const technologies = new Map<string, string>();
	const visit = (technology: SkillTreeTechnology) => {
		technologies.set(technology.id, technology.name);
		for (const child of technology.children ?? []) visit(child);
	};
	for (const category of tree) category.technologies.forEach(visit);

	return {
		technologies: [...technologies]
			.map(([value, label]) => ({ value, label }))
			.sort((a, b) => a.label.localeCompare(b.label)),
		categories: tree.map((category) => ({
			value: category.id,
			label: category.name,
		})),
	};
}

function parseLink(value: string | null) {
	const match = value?.match(/^(tech|cat)-(\d+)$/);
	if (!match) return null;
	return match[1] === "tech"
		? ({ type: "technology", id: Number(match[2]) } as const)
		: ({ type: "category", id: Number(match[2]) } as const);
}

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

// The skill tree ids concepts as "concept-<id>" (see getSkillTree); the update
// API needs the raw numeric id back.
function parseConceptId(id: string): number | null {
	const match = id.match(/^concept-(\d+)$/);
	return match ? Number(match[1]) : null;
}

function EditConceptForm({
	concept,
	onSaved,
}: {
	concept: BrowseConcept;
	onSaved: () => void;
}) {
	const queryClient = useQueryClient();
	const skillTree = useQuery(skillTreeQueryOptions);
	const conceptId = parseConceptId(concept.id);

	// Seeded from the concept on mount; the dialog unmounts this form on close,
	// so it always reseeds from fresh data on the next open.
	const [name, setName] = useState(concept.name);
	const [status, setStatus] = useState<ConceptStatus>(concept.status);
	const [importance, setImportance] = useState(concept.importance);
	const [description, setDescription] = useState(concept.description ?? "");
	const [linkValue, setLinkValue] = useState<string | null>(
		`${concept.link.type === "technology" ? "tech" : "cat"}-${concept.link.id}`,
	);
	const options = useMemo(
		() =>
			skillTree.data
				? buildLinkOptions(skillTree.data)
				: { technologies: [], categories: [] },
		[skillTree.data],
	);
	const items = useMemo(
		() => [...options.technologies, ...options.categories],
		[options],
	);

	const mutation = useMutation({
		mutationFn: (input: UpdateConceptInput) =>
			window.api.concepts.update(input),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: skillTreeQueryOptions.queryKey,
			});
			// Prefix key: refreshes both dashboard stats and the recently-learned list.
			queryClient.invalidateQueries({ queryKey: ["dashboard"] });
			onSaved();
		},
	});

	const link = parseLink(linkValue);
	const canSubmit =
		conceptId !== null &&
		name.trim() !== "" &&
		link !== null &&
		!mutation.isPending;

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		if (!canSubmit || conceptId === null || link === null) return;
		mutation.mutate({
			id: conceptId,
			name,
			description: description.trim() || null,
			status,
			importance,
			link,
		});
	};

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-5">
			<NameField value={name} onChange={setName} />

			<div className="flex flex-col gap-2">
				<Label htmlFor="concept-link">Belongs to</Label>
				{skillTree.isError ? (
					<p className="text-destructive text-sm">
						Couldn't load technologies and categories: {skillTree.error.message}
					</p>
				) : (
					<Select
						items={items}
						value={linkValue}
						onValueChange={setLinkValue}
						disabled={skillTree.isPending}
					>
						<SelectTrigger id="concept-link" className="w-full">
							<SelectValue
								placeholder={
									skillTree.isPending ? "Loading…" : "Select existing"
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
				)}
				<p className="text-muted-foreground text-xs">
					Choose an existing technology or category.
				</p>
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
					{mutation.isPending ? "Saving…" : "Save changes"}
				</Button>
			</div>
		</form>
	);
}

export function EditConceptDialog({
	concept,
	open,
	onOpenChange,
}: {
	concept: BrowseConcept;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Edit concept</DialogTitle>
					<DialogDescription>
						Update this concept and where it belongs.
					</DialogDescription>
				</DialogHeader>
				{/* Keyed by concept id so switching which concept is edited (or
				    editing after a save) remounts the form with fresh seed values. */}
				<EditConceptForm
					key={concept.id}
					concept={concept}
					onSaved={() => onOpenChange(false)}
				/>
			</DialogContent>
		</Dialog>
	);
}
