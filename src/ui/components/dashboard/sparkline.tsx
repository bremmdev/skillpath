import { cn } from "@/ui/lib/utils";

type SparklineProps = {
	data: number[];
	className?: string;
	width?: number;
	height?: number;
};

/**
 * Minimal inline-SVG sparkline. Kept dependency-free (recharts is reserved for
 * the larger charts) so the stat cards stay cheap to render.
 */
export function Sparkline({
	data,
	className,
	width = 88,
	height = 36,
}: SparklineProps) {
	if (data.length < 2) {
		return null;
	}

	const padY = 4;
	const max = Math.max(...data);
	const min = Math.min(...data);
	const range = max - min || 1;
	const step = width / (data.length - 1);

	const points = data.map((value, index) => {
		const x = index * step;
		const y = padY + (height - padY * 2) * (1 - (value - min) / range);
		return [x, y] as const;
	});

	const line = points.map(([x, y]) => `${x},${y}`).join(" ");

	return (
		<svg
			viewBox={`0 0 ${width} ${height}`}
			width={width}
			height={height}
			fill="none"
			role="img"
			aria-label="Trend over time"
			className={cn("text-chart-2 overflow-visible", className)}
		>
			<polyline
				points={line}
				stroke="currentColor"
				strokeWidth={1.75}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}
