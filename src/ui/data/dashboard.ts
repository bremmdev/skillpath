/**
 * Mock data for the SkillPath home dashboard.
 *
 * This is placeholder data that mirrors the dashboard design. Once the app is
 * wired to the database, these structures can be replaced by real queries while
 * the component layer keeps consuming the same shapes.
 */

export type User = {
  name: string;
  initials: string;
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

export const currentUser: User = {
  name: "Alex",
  initials: "AX",
};

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
