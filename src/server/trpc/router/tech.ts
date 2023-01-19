import { router, publicProcedure } from "../trpc";
import { techInputSchema } from "../../../schema/tech.schema";
import { z } from "zod";

export const techRouter = router({
  findAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.tech.findMany({
      orderBy: {
        name: "asc",
      },
    });
  }),
  create: publicProcedure
    //use zod schema for input
    .input(techInputSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.tech.create({
        data: {
          name: input.name,
          description: input.description,
          icon: input.icon,
          url: input.url,
        },
      });
    }),
  deleteById: publicProcedure
    .input(z.string().cuid())
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.tech.delete({
        where: {
          id: input,
        },
      });
    }),
});
