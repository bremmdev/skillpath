import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useState } from "react";

import type { Category, CreateCategoryInput } from "#/electron/db/types";
import { ipcErrorMessage } from "@/ui/components/concepts/concept-fields";
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
import { categoriesQueryOptions, skillTreeQueryOptions } from "@/ui/lib/query";

function AddCategoryForm({ onAdded }: { onAdded: () => void }) {
	const queryClient = useQueryClient();
	const [name, setName] = useState("");

	const mutation = useMutation({
		mutationFn: (input: CreateCategoryInput): Promise<Category> =>
			window.api.categories.create(input),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: skillTreeQueryOptions.queryKey,
			});
			queryClient.invalidateQueries({
				queryKey: categoriesQueryOptions.queryKey,
			});
			// Prefix key: category counts feed the dashboard's stat cards.
			queryClient.invalidateQueries({ queryKey: ["dashboard"] });
			onAdded();
		},
	});

	const canSubmit = name.trim() !== "" && !mutation.isPending;

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		if (!canSubmit) return;
		mutation.mutate({ name });
	};

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-5">
			<div className="flex flex-col gap-2">
				<Label htmlFor="category-name">Name</Label>
				<Input
					id="category-name"
					value={name}
					onChange={(event) => setName(event.target.value)}
					placeholder="e.g. Operating Systems"
					autoFocus
					required
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
					{mutation.isPending ? "Adding…" : "Add category"}
				</Button>
			</div>
		</form>
	);
}

/**
 * "Add category" modal. The trigger is supplied by the caller so the same flow
 * can wear a page button (browse) or a map-panel button (skill map); this owns
 * the open state and the form. The form (and its mutation state) unmounts with
 * the dialog, so closing always resets it.
 */
export function AddCategoryDialog({ trigger }: { trigger: ReactElement }) {
	const [open, setOpen] = useState(false);
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger render={trigger} />
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Add category</DialogTitle>
					<DialogDescription>
						Create a broad area of knowledge to group technologies and concepts
						under.
					</DialogDescription>
				</DialogHeader>
				<AddCategoryForm onAdded={() => setOpen(false)} />
			</DialogContent>
		</Dialog>
	);
}
