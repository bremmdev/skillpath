import { router, publicProcedure } from "../trpc";

export const projectRouter = router({
  findAll: publicProcedure
    .query(async ({ ctx }) => {
      return await ctx.prisma.project.findMany({
        orderBy: {
          title: "asc"
        }
      });
    }),
});
