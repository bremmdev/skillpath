import { z } from "zod";

import { router, publicProcedure } from "../trpc";

export const techRouter = router({
  findAll: publicProcedure
    .query(async ({ ctx }) => {
      return await ctx.prisma.tech.findMany();
    }),
});
