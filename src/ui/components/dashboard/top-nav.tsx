import { Link } from "@tanstack/react-router";
import skillpathIcon from "@/assets/icon.svg";
import { LogConceptDialog } from "@/ui/components/concepts/log-concept-dialog";
import { cn } from "@/ui/lib/utils";

const navItems = [
	{ label: "Overview", to: "/" },
	{ label: "Skill map", to: "/skill-map" },
	{ label: "Browse", to: "/browse" },
	{ label: "Insights", to: "/insights" },
];

export function TopNav() {
	return (
		<header className="bg-background sticky top-0 z-30 border-b">
			<div className="flex h-16 w-full items-center gap-6 px-6">
				<div className="flex items-center gap-2.5">
					<img
						src={skillpathIcon}
						alt=""
						className="size-7 rounded-md"
						aria-hidden="true"
					/>
					<span className="text-[15px] font-semibold tracking-tight">
						Skillpath
					</span>
				</div>

				<nav className="flex items-center gap-1">
					{navItems.map((item) => (
						<Link
							key={item.label}
							to={item.to}
							// "/" prefix-matches every path, so require an exact match for it;
							// other routes stay active for their nested paths.
							activeOptions={{ exact: item.to === "/" }}
							className={cn(
								"rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
								"text-muted-foreground hover:text-foreground",
								"data-[status=active]:text-brand font-semibold",
							)}
						>
							{item.label}
						</Link>
					))}
				</nav>

				<div className="ml-auto">
					<LogConceptDialog />
				</div>
			</div>
		</header>
	);
}
