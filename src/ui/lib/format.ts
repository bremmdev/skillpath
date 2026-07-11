/**
 * Formats an ISO timestamp as a short, compact relative label for the dashboard
 * ("Just now", "5m ago", "2h ago", "Yesterday", "3d ago", "2w ago"). Anything
 * older than a few weeks falls back to an absolute date. Computed at render time
 * so the label never goes stale in the query cache.
 */
export function formatRelativeTime(iso: string): string {
	const then = new Date(iso).getTime();
	if (Number.isNaN(then)) return "";

	const diffMs = Math.max(0, Date.now() - then);
	const minutes = Math.floor(diffMs / 60_000);
	if (minutes < 1) return "Just now";
	if (minutes < 60) return `${minutes}m ago`;

	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;

	const days = Math.floor(hours / 24);
	if (days === 1) return "Yesterday";
	if (days < 7) return `${days}d ago`;

	const weeks = Math.floor(days / 7);
	if (weeks < 5) return `${weeks}w ago`;

	return new Date(iso).toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}
