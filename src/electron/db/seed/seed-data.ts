import type { ConceptStatus } from "../types.js";

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
 * A technology may set both (reaching a category directly and, redundantly,
 * through its parent). Root technologies must set `category`.
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
    importance: 3,
  },
  {
    name: "TypeScript",
    parentTechnology: "JavaScript",
    importance: 3,
  },
  {
    name: "C#",
    category: "Programming Languages",
    importance: 2,
  },
  {
    name: "React",
    parentTechnology: "JavaScript",
    importance: 3,
  },
  {
    name: "Next.js",
    parentTechnology: "JavaScript",
    importance: 2,
  },
  {
    name: "TanStack Start",
    parentTechnology: "JavaScript",
    importance: 2,
  },
  {
    name: "Astro",
    parentTechnology: "JavaScript",
    importance: 2,
  },

  // --- Databases ------------------------------------------------------------
  {
    name: "Relational (SQL)",
    description:
      "Databases organized around tables and relations, queried with SQL.",
    category: "Databases",
    importance: 3,
  },
  {
    name: "NoSQL",
    description:
      "Non-relational databases: document, key-value, wide-column, and graph stores.",
    category: "Databases",
    importance: 2,
  },
  {
    name: "Azure Cosmos DB",
    description: "A globally distributed, multi-model NoSQL database service.",
    parentTechnology: "NoSQL",
    importance: 2,
  },
  {
    name: "SQLite",
    parentTechnology: "Relational (SQL)",
    importance: 3,
  },
  {
    name: "PostgreSQL",
    parentTechnology: "Relational (SQL)",
    importance: 2,
  },

  // --- Cloud: Azure ---------------------------------------------------------
  {
    name: "Azure",
    category: "Cloud",
  },
  {
    name: "Azure App Service",
    description:
      "A fully managed platform for hosting web apps, REST APIs, and backends without managing servers.",
    parentTechnology: "Azure",
  },
  {
    name: "Azure Functions",
    description:
      "A serverless compute service for running event-driven code without provisioning infrastructure.",
    parentTechnology: "Azure",
  },
  {
    name: "Azure Static Web Apps",
    description:
      "A service for hosting static frontends with globally distributed content and integrated serverless APIs via Azure Functions.",
    parentTechnology: "Azure",
  },
  {
    name: "Microsoft Foundry",
    description:
      "Azure's platform for building, evaluating, and deploying generative AI applications and agents.",
    parentTechnology: "Azure",
  },

  // --- Cloud: Cloudflare ----------------------------------------------------
  {
    name: "Cloudflare",
    category: "Cloud",
    importance: 2,
  },
  {
    name: "Cloudflare Workers",
    description:
      "A serverless platform for running JavaScript and WebAssembly at the edge across Cloudflare's network.",
    parentTechnology: "Cloudflare",
    importance: 2,
  },
];

/**
 * Seed shape for a concept. `link.name` is a name-based reference the seeder
 * resolves (by slug) to a technology or category id; per schema rule 5 a concept
 * links to exactly one of them. `createdAt` is an ISO timestamp applied to both
 * the concept row and its initial status-history event, so the time-based
 * queries see the seeded date rather than "now".
 */
export type SeedConcept = {
  name: string;
  description?: string;
  /** Omit to accept the DB default of "discovered". */
  status?: ConceptStatus;
  /** ISO timestamp; omit to accept the DB default of the current time. */
  createdAt?: string;
  /** 1–5; omit to accept the DB default of 3. */
  importance?: number;
  link:
    | { type: "technology"; name: string }
    | { type: "category"; name: CategoryName };
};

export const concepts: SeedConcept[] = [
  {
    name: "rowid",
    description:
      "Automatically created secret PK for your db. The rowid (not your own PK) is used as the clustered index, your own PK acts as a secondary index. Your PK and rowid become aliases for each other when you declare the PK as INTEGER PRIMARY KEY.",
    status: "learned",
    createdAt: new Date("2026-06-28").toISOString(),
    importance: 2,
    link: {
      type: "technology",
      name: "SQLite",
    },
  },
  {
    name: "Clustered Index",
    description:
      "The clustered index is the index that is used to store the data physically on disk. Usually this is the primary key of the table, but in SQLite, for example, the rowid is the clustered index.",
    status: "learned",
    createdAt: new Date("2026-06-28").toISOString(),
    importance: 2,
    link: {
      type: "technology",
      name: "Relational (SQL)",
    },
  },
  {
    name: "File-based Apps",
    description:
      "Feature to execute .cs files directly, eliminating the need for a full project structure, making C# more accessible for quick scripting and prototyping.",
    status: "learned",
    createdAt: new Date("2026-05-19").toISOString(),
    importance: 2,
    link: {
      type: "technology",
      name: "C#",
    },
  },
];
