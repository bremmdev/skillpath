import { router } from "../trpc";
import { projectRouter } from "./project";
import { techRouter } from "./tech";
import { featureRouter } from "./feature";

export const appRouter = router({
  tech: techRouter,
  project: projectRouter,
  feature: featureRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;
