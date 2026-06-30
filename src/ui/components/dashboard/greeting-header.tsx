import { Tabs, TabsList, TabsTrigger } from "@/ui/components/ui/tabs";
import { defaultTimeRange, timeRanges } from "@/ui/data/dashboard";

export function GreetingHeader() {
	return (
		<section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h1 className="font-heading text-2xl font-semibold tracking-tight">
					Good morning, Matt
				</h1>
				<p className="text-muted-foreground mt-1 text-sm">
					{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
				</p>
			</div>

			<Tabs defaultValue={defaultTimeRange}>
				<TabsList>
					{timeRanges.map((range) => (
						<TabsTrigger key={range} value={range} className="px-3.5">
							{range}
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>
		</section>
	);
}
