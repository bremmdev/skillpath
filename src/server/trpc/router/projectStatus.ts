import { router, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const projectStatusRouter = router({
  findAll: publicProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.prisma.projectStatus.findMany({
        orderBy: {
          status: "asc",
        },
      });
    } catch (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Could not fetch project statuses",
      });
    }
  }),
});
