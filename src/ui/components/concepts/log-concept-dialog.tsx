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
import { Textarea } from "@/ui/components/ui/textarea";
import { conceptStatuses, statusMeta } from "@/ui/data/browse";
import { skillTreeQueryOptions } from "@/ui/lib/query";
import { cn } from "@/ui/lib/utils";

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

function parseLink(value: string): ConceptLink | null {
	const match = value.match(/^(tech|cat)-(\d+)$/);
	if (!match) return null;
	return {
		type: match[1] === "tech" ? "technology" : "category",
		id: Number(match[2]),
	};
}

// Electron prefixes rejections that cross IPC with "Error invoking remote
// method 'concepts:create': Error: …" — strip that down to the real message.
function ipcErrorMessage(error: Error): string {
	return error.message.replace(
		/^Error invoking remote method '[^']+': (?:Error: )?/,
		"",
	);
}

function ChipButton({
	active,
	onClick,
	children,
	className,
}: {
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-pressed={active}
			className={cn(
				"flex items-center gap-1.5 border px-2.5 py-1 text-xs font-medium transition-colors",
				active
					? "border-foreground bg-foreground text-background"
					: "border-border text-muted-foreground hover:text-foreground",
				className,
			)}
		>
			{children}
		</button>
	);
}

function LogConceptForm({ onLogged }: { onLogged: () => void }) {
	const queryClient = useQueryClient();
	// Mounted only while the dialog is open, so the tree is fetched (or read
	// from the cache primed by /browse) on first open, not at app start.
	const skillTree = useQuery(skillTreeQueryOptions);

	const [name, setName] = useState("");
	const [linkValue, setLinkValue] = useState<string | null>(null);
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

	const mutation = useMutation({
		mutationFn: (input: CreateConceptInput) =>
			window.api.concepts.create(input),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: skillTreeQueryOptions.queryKey,
			});
			onLogged();
		},
	});

	const link = linkValue === null ? null : parseLink(linkValue);
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
			<div className="flex flex-col gap-2">
				<Label htmlFor="concept-name">Name</Label>
				<Input
					id="concept-name"
					value={name}
					onChange={(event) => setName(event.target.value)}
					placeholder="e.g. Closures"
					autoFocus
					required
				/>
			</div>

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
									skillTree.isPending
										? "Loading…"
										: "Pick a technology or category"
								}
							/>
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								<SelectLabel>Technologies</SelectLabel>
								{options.technologies.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectGroup>
							<SelectGroup>
								<SelectLabel>Categories</SelectLabel>
								{options.categories.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
				)}
			</div>

			{/* legend can't be a flex item, so these use block flow + mt-2 to match
			    the flex-col gap-2 of the other fields. */}
			<fieldset>
				<legend className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase select-none">
					Status
				</legend>
				<div className="mt-2 flex flex-wrap gap-1.5">
					{conceptStatuses.map((s) => (
						<ChipButton
							key={s}
							active={status === s}
							onClick={() => setStatus(s)}
						>
							<span
								className={cn("size-1.5 rounded-full", statusMeta[s].dot)}
							/>
							{statusMeta[s].label}
						</ChipButton>
					))}
				</div>
			</fieldset>

			<fieldset>
				<legend className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase select-none">
					Importance
				</legend>
				<div className="mt-2 flex gap-1.5">
					{[1, 2, 3].map((level) => (
						<ChipButton
							key={level}
							active={importance === level}
							onClick={() => setImportance(level)}
							className="min-w-8 justify-center"
						>
							{level}
						</ChipButton>
					))}
				</div>
			</fieldset>

			<div className="flex flex-col gap-2">
				<Label htmlFor="concept-description">Notes</Label>
				<Textarea
					id="concept-description"
					value={description}
					onChange={(event) => setDescription(event.target.value)}
					placeholder="Optional: what is it, where did you use it…"
					rows={3}
				/>
			</div>

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
