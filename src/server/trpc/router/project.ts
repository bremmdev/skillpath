import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const projectRouter = router({
  findAll: publicProcedure
    .query(async ({ ctx }) => {
      return await ctx.prisma.project.findMany({
        orderBy: {
          title: "asc"
        }
      });
    }),
  deleteById: publicProcedure
    .input(z.string().cuid())
    .mutation(async ({ ctx, input }) => {
      try {
        //check if project exists
        const project = await ctx.prisma.project.findUnique({
          where: {
            id: input
          }
        });

        if (!project) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Project does not exist"
          });
        }

        await ctx.prisma.project.delete({
          where: {
            id: input
          }
        });
      } catch (err) {
        if (err instanceof TRPCError) {
          throw new TRPCError(err);
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal Server Error"
        });
      }
    })
});
