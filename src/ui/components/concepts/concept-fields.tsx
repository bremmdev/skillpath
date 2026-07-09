import type { ConceptStatus } from "#/electron/db/types";
import { Input } from "@/ui/components/ui/input";
import { Label } from "@/ui/components/ui/label";
import { Textarea } from "@/ui/components/ui/textarea";
import { conceptStatuses, statusMeta } from "@/ui/data/browse";
import { cn } from "@/ui/lib/utils";

// Fields shared by the log (create) and edit concept forms. The "belongs to"
// picker lives only in the log form, since editing doesn't re-parent a concept.

// Electron prefixes rejections that cross IPC with "Error invoking remote
// method 'concepts:create': Error: …" — strip that down to the real message.
export function ipcErrorMessage(error: Error): string {
	return error.message.replace(
		/^Error invoking remote method '[^']+': (?:Error: )?/,
		"",
	);
}

export function ChipButton({
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

export function NameField({
	value,
	onChange,
}: {
	value: string;
	onChange: (value: string) => void;
}) {
	return (
		<div className="flex flex-col gap-2">
			<Label htmlFor="concept-name">Name</Label>
			<Input
				id="concept-name"
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder="e.g. Closures"
				autoFocus
				required
			/>
		</div>
	);
}

export function StatusChips({
	value,
	onChange,
}: {
	value: ConceptStatus;
	onChange: (status: ConceptStatus) => void;
}) {
	return (
		// legend can't be a flex item, so this uses block flow + mt-2 to match the
		// flex-col gap-2 of the other fields.
		<fieldset>
			<legend className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase select-none">
				Status
			</legend>
			<div className="mt-2 flex flex-wrap gap-1.5">
				{conceptStatuses.map((s) => (
					<ChipButton key={s} active={value === s} onClick={() => onChange(s)}>
						<span className={cn("size-1.5 rounded-full", statusMeta[s].dot)} />
						{statusMeta[s].label}
					</ChipButton>
				))}
			</div>
		</fieldset>
	);
}

export function ImportanceChips({
	value,
	onChange,
}: {
	value: number;
	onChange: (importance: number) => void;
}) {
	return (
		<fieldset>
			<legend className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase select-none">
				Importance
			</legend>
			<div className="mt-2 flex gap-1.5">
				{[1, 2, 3].map((level) => (
					<ChipButton
						key={level}
						active={value === level}
						onClick={() => onChange(level)}
						className="min-w-8 justify-center"
					>
						{level}
					</ChipButton>
				))}
			</div>
		</fieldset>
	);
}

export function NotesField({
	value,
	onChange,
}: {
	value: string;
	onChange: (value: string) => void;
}) {
	return (
		<div className="flex flex-col gap-2">
			<Label htmlFor="concept-description">Notes</Label>
			<Textarea
				id="concept-description"
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder="Optional: what is it, where did you use it…"
				rows={3}
			/>
		</div>
	);
}
