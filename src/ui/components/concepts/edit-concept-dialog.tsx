import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import type { ConceptStatus, UpdateConceptInput } from "#/electron/db/types";
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
import type { BrowseConcept } from "@/ui/data/browse";
import { skillTreeQueryOptions } from "@/ui/lib/query";

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
	const conceptId = parseConceptId(concept.id);

	// Seeded from the concept on mount; the dialog unmounts this form on close,
	// so it always reseeds from fresh data on the next open.
	const [name, setName] = useState(concept.name);
	const [status, setStatus] = useState<ConceptStatus>(concept.status);
	const [importance, setImportance] = useState(concept.importance);
	const [description, setDescription] = useState(concept.description ?? "");

	const mutation = useMutation({
		mutationFn: (input: UpdateConceptInput) =>
			window.api.concepts.update(input),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: skillTreeQueryOptions.queryKey,
			});
			onSaved();
		},
	});

	const canSubmit =
		conceptId !== null && name.trim() !== "" && !mutation.isPending;

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		if (!canSubmit || conceptId === null) return;
		mutation.mutate({
			id: conceptId,
			name,
			description: description.trim() || null,
			status,
			importance,
		});
	};

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-5">
			<NameField value={name} onChange={setName} />

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
						Update this concept's name, status, importance, or notes.
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
