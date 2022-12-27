import { router } from "../trpc";
import { techRouter } from "./tech";

export const appRouter = router({
  tech: techRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
