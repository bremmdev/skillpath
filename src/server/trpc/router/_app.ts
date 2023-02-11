import { router } from "../trpc";
import { projectRouter } from "./project";
import { techRouter } from "./tech";
import { projectStatusRouter } from "./projectStatus";

export const appRouter = router({
  tech: techRouter,
  project: projectRouter,
  projectStatus: projectStatusRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
