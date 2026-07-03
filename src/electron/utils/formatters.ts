// Names whose default slug would be lossy or ambiguous, mapped by hand. Keyed
// by lowercased input. E.g. the general rule turns "C#" into "c", so it's
// hardcoded here instead.
const slugOverrides: Record<string, string> = {
  "c#": "c-sharp",
};

// Produces a slug valid for the DB CHECK constraint on category/technology
// (slug GLOB '[a-z0-9]*' AND slug NOT GLOB '*[^a-z0-9-]*'): lowercase, only
// [a-z0-9-], and starting with an alphanumeric. Every run of other characters
// (spaces, ".", "#", …) collapses to a single hyphen, then leading/trailing
// hyphens are trimmed. E.g. "Next.js" -> "next-js". See slugOverrides for
// hand-mapped exceptions like "C#" -> "c-sharp".
export const formatSlug = (str: string) => {
  const lowered = str.toLowerCase();
  return (
    slugOverrides[lowered] ??
    lowered.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
  );
};
