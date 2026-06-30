/**
 * Mock data for the SkillPath home dashboard.
 *
 * This is placeholder data that mirrors the dashboard design. Once the app is
 * wired to the database, these structures can be replaced by real queries while
 * the component layer keeps consuming the same shapes.
 */

export type NavItem = {
  label: string;
  to: string;
  active?: boolean;
};

export type User = {
  name: string;
  initials: string;
};

export type StatCard = {
  id: string;
  label: string;
  value: string;
  caption: string;
  /** Sparkline series — normalized-ish values, smallest to largest x. */
  trend: number[];
};

export type RecentConcept = {
  id: string;
  title: string;
  technologies: string[];
  timeAgo: string;
  category: string;
};

export type SkillProfilePoint = {
  month: string;
  score: number;
};

export type SkillProfileHighlight = {
  label: string;
  value: string;
  caption: string;
};

export type ImprovingArea = {
  category: string;
  strength: number;
  delta: number;
};

export const navItems: NavItem[] = [
  { label: "Home", to: "/", active: true },
  { label: "Skill map", to: "/skill-map" },
  { label: "Browse", to: "/browse" },
  { label: "Insights", to: "/insights" },
];

export const currentUser: User = {
  name: "Alex",
  initials: "AX",
};

export const timeRanges = ["Week", "Month", "Year", "All time"] as const;
export type TimeRange = (typeof timeRanges)[number];
export const defaultTimeRange: TimeRange = "Month";

export const statCards: StatCard[] = [
  {
    id: "concepts",
    label: "Concepts logged",
    value: "9",
    caption: "+3 this week",
    trend: [3, 4, 4, 5, 6, 7, 9],
  },
  {
    id: "technologies",
    label: "Technologies",
    value: "12",
    caption: "across 8 categories",
    trend: [6, 7, 8, 9, 10, 11, 12],
  },
  {
    id: "categories",
    label: "Active categories",
    value: "10",
    caption: "of 10 tracked",
    trend: [5, 6, 7, 7, 8, 9, 10],
  },
  {
    id: "streak",
    label: "Day streak",
    value: "6",
    caption: "personal best",
    trend: [2, 4, 3, 5, 4, 5, 6],
  },
];

export const recentConcepts: RecentConcept[] = [
  {
    id: "css-container-queries",
    title: "CSS container queries",
    technologies: ["Tailwind CSS", "Styling"],
    timeAgo: "2h ago",
    category: "Styling",
  },
  {
    id: "react-server-components",
    title: "React Server Components",
    technologies: ["React", "Frontend"],
    timeAgo: "Yesterday",
    category: "Frontend",
  },
  {
    id: "postgresql-indexing",
    title: "PostgreSQL indexing strategies",
    technologies: ["PostgreSQL", "Databases"],
    timeAgo: "2d ago",
    category: "Databases",
  },
  {
    id: "prompt-engineering",
    title: "Prompt engineering for structured output",
    technologies: ["OpenAI API", "AI"],
    timeAgo: "3d ago",
    category: "AI",
  },
  {
    id: "docker-multi-stage",
    title: "Docker multi-stage builds",
    technologies: ["Docker", "DevOps"],
    timeAgo: "4d ago",
    category: "DevOps",
  },
  {
    id: "vnet-azure-functions",
    title: "VNET integration for Azure Functions",
    technologies: ["Azure Functions", "Cloud"],
    timeAgo: "5d ago",
    category: "Cloud",
  },
];

export const skillProfile = {
  score: 63,
  deltaSinceJan: 21,
  series: [
    { month: "Jan", score: 42 },
    { month: "Feb", score: 46 },
    { month: "Mar", score: 50 },
    { month: "Apr", score: 54 },
    { month: "May", score: 58 },
    { month: "Jun", score: 63 },
  ] satisfies SkillProfilePoint[],
  highlights: [
    { label: "Strongest", value: "Frontend", caption: "72%" },
    { label: "Fastest", value: "Cloud", caption: "+5 this month" },
    { label: "Focus", value: "AI", caption: "38%" },
  ] satisfies SkillProfileHighlight[],
};

export const improvingAreas: ImprovingArea[] = [
  { category: "Frontend", strength: 72, delta: 6 },
  { category: "Programming Languages", strength: 68, delta: 4 },
  { category: "Cloud", strength: 64, delta: 5 },
  { category: "Styling", strength: 60, delta: 5 },
  { category: "Databases", strength: 51, delta: 3 },
  { category: "DevOps", strength: 48, delta: 4 },
  { category: "AI", strength: 38, delta: 3 },
];
