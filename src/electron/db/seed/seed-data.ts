export const categories = [
  "Accessibility",
  "Artificial Intelligence",
  "Cloud",
  "DevOps",
  "Databases",
  "Programming Languages",
  "Infrastructure",
  "Networking",
  "Security",
  "Styling",
] as const;

export type CategoryName = (typeof categories)[number];

/**
 * Seed shape for a technology. `category` and `parentTechnology` are name-based
 * references that the seeder resolves to `category_id` / `parent_technology_id`.
 *
 * Per the schema (see ../migrations.ts) every technology must reach a category:
 *   - directly, via `category`, or
 *   - transitively, through its `parentTechnology`.
 * A technology may have both (e.g. Azure Cosmos DB nests under Azure → Cloud but
 * is also tagged Databases). Root technologies must set `category`.
 */
export type SeedTechnology = {
  name: string;
  description?: string;
  /** Broad area this technology belongs to. Omit when a parent already reaches one. */
  category?: CategoryName;
  /** Name of the parent technology, e.g. "Azure" for "Azure Functions". */
  parentTechnology?: string;
  /** 1–5; omit to accept the DB default of 3. */
  importance?: number;
};

export const technologies: SeedTechnology[] = [
  // --- Programming Languages ------------------------------------------------
  {
    name: "JavaScript",
    category: "Programming Languages",
    importance: 5,
  },
  {
    name: "TypeScript",
    parentTechnology: "JavaScript",
    importance: 5,
  },
  {
    name: "C#",
    category: "Programming Languages",
    importance: 4,
  },
  {
    name: "React",
    parentTechnology: "JavaScript",
    importance: 5,
  },
  {
    name: "Next.js",
    parentTechnology: "JavaScript",
    importance: 4,
  },
  {
    name: "TanStack Start",
    parentTechnology: "JavaScript",
    importance: 4,
  },
  {
    name: "Astro",
    parentTechnology: "JavaScript",
    importance: 3,
  },

  // --- Databases ------------------------------------------------------------
  {
    name: "SQLite",
    category: "Databases",
    importance: 5,
  },
  {
    name: "PostgreSQL",
    category: "Databases",
    importance: 4,
  },

  // --- Cloud: Azure ---------------------------------------------------------
  {
    name: "Azure",
    category: "Cloud",
    importance: 5,
  },
  {
    name: "Azure App Service",
    description:
      "A fully managed platform for hosting web apps, REST APIs, and backends without managing servers.",
    parentTechnology: "Azure",
    importance: 4,
  },
  {
    name: "Azure Functions",
    description:
      "A serverless compute service for running event-driven code without provisioning infrastructure.",
    parentTechnology: "Azure",
    importance: 5,
  },
  {
    name: "Azure Static Web Apps",
    description:
      "A service for hosting static frontends with globally distributed content and integrated serverless APIs via Azure Functions.",
    parentTechnology: "Azure",
    importance: 3,
  },
  {
    name: "Microsoft Foundry",
    description:
      "Azure's platform for building, evaluating, and deploying generative AI applications and agents.",
    parentTechnology: "Azure",
    importance: 4,
  },
  {
    name: "Azure Cosmos DB",
    description: "A globally distributed, multi-model NoSQL database service.",
    parentTechnology: "Azure",
    category: "Databases",
    importance: 3,
  },

  // --- Cloud: Cloudflare ----------------------------------------------------
  {
    name: "Cloudflare",
    category: "Cloud",
    importance: 4,
  },
  {
    name: "Cloudflare Workers",
    description:
      "A serverless platform for running JavaScript and WebAssembly at the edge across Cloudflare's network.",
    parentTechnology: "Cloudflare",
    importance: 4,
  },
];
