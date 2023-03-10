import { router, publicProcedure } from "../trpc";
import { techInputSchema } from "../../../schema/tech.schema";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";

export const techRouter = router({
  findAll: publicProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.prisma.tech.findMany({
        orderBy: {
          name: "asc",
        },
      });
    } catch (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Could not fetch tech",
      });
    }
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

        const projects = await ctx.prisma.project.findMany({
          where: {
            Tech: {
              some: {
                id: input,
              },
            },
          },
        });

        if (projects.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "There are still projects using this tech",
          });
        }

        await ctx.prisma.tech.delete({
          where: {
            id: input,
          },
        });
      } catch (err) {
        if (err instanceof TRPCError) {
          throw new TRPCError(err);
        }

        if (
          err instanceof PrismaClientKnownRequestError &&
          err.code === "P2003"
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "There are still features using this tech",
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal Server Error",
        });
      }
    }),
});
