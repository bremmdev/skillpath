// Buckets the current hour into a greeting: morning 6–11, afternoon 12–17,
// everything else (evening/night) "Good evening".
function timeOfDayGreeting(date: Date): string {
	const hour = date.getHours();
	if (hour >= 5 && hour < 12) return "Good morning";
	if (hour >= 12 && hour < 18) return "Good afternoon";
	return "Good evening";
}

export function GreetingHeader() {
	const now = new Date();

	return (
		<section>
			<h1 className="font-heading text-2xl font-semibold tracking-tight">
				{timeOfDayGreeting(now)}, Matt
			</h1>
			<p className="text-muted-foreground mt-1 text-sm">
				{now.toLocaleDateString("en-US", {
					weekday: "long",
					month: "long",
					day: "numeric",
				})}
			</p>
		</section>
	);
}
