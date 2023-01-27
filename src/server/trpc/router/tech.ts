import { router, publicProcedure } from "../trpc";
import { techInputSchema } from "../../../schema/tech.schema";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

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
      try {
        //check if tech already exists
        const tech = await ctx.prisma.tech.findMany({
          select: {
            name: true,
          },
        });

        const techExists = tech.find(
          (t) => t.name.toLowerCase() === input.name.toLowerCase()
        );

        if (techExists) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Tech already exists",
          });
        }

        return await ctx.prisma.tech.create({
          data: {
            name: input.name,
            description: input.description,
            icon: input.icon,
            url: input.url,
          },
        });
      } catch (err) {
        if (err instanceof TRPCError) {
          throw new TRPCError(err);
        } else {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Internal Server Error",
          });
        }
      }
    }),
  deleteById: publicProcedure
    .input(z.string().cuid())
    .mutation(async ({ ctx, input }) => {
      try {
        //check if tech exists
        const tech = await ctx.prisma.tech.findUnique({
          where: {
            id: input,
          },
        });

        if (!tech) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Tech does not exist",
          });
        }

        await ctx.prisma.tech.delete({
          where: {
            id: input
          },
        });
      } catch (err) {
        if (err instanceof TRPCError) {
          throw new TRPCError(err);
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal Server Error",
        });
      }
    }),
});
