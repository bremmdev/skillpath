import { router } from "../trpc";
import { projectRouter } from "./project";
import { techRouter } from "./tech";

export const appRouter = router({
  tech: techRouter,
  project: projectRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;
