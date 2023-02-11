import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { projectInputSchema } from "../../../schema/project.schema";

export const projectRouter = router({
  findAll: publicProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.prisma.project.findMany({
        orderBy: {
          title: "asc",
        },
      });
    } catch (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Could not fetch projects",
      });
    }
  }),
  deleteById: publicProcedure
    .input(z.string().cuid())
    .mutation(async ({ ctx, input }) => {
      try {
        //check if project exists
        const project = await ctx.prisma.project.findUnique({
          where: {
            id: input,
          },
        });

        if (!project) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Project does not exist",
          });
        }

        await ctx.prisma.project.delete({
          where: {
            id: input,
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
  create: publicProcedure
    .input(projectInputSchema)
    .mutation(async ({ ctx, input }) => {
      //check if project already exists
      const projects = await ctx.prisma.project.findMany({
        select: {
          title: true,
        },
      });

      const projectExists = projects.find(
        (p) => p.title.toLowerCase() === input.title.toLowerCase()
      );

      if (projectExists) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Project already exists",
        });
      }

      const {
        title,
        description,
        repo,
        url,
        imageUrl,
        statusId,
        startDate,
        tech,
      } = input;
      try {
        const project = await ctx.prisma.project.create({
          data: {
            title,
            description,
            repo,
            url,
            imageUrl,
            statusId,
            startDate,
            Tech: {
              connect: tech.map((id) => ({ id })),
            },
          },
        });
        return project;
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
