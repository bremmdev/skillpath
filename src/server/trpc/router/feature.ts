import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { featureInputSchema } from "../../../schema/feature.schema";

export const featureRouter = router({
  findAll: publicProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.prisma.feature.findMany({
        orderBy: {
          dateLearned: "desc",
        },
        include: {
          Tech: {
            select: {
              name: true,
              icon: true,
            },
          },
        },
      });
    } catch (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Could not fetch features",
      });
    }
  }),
  deleteById: publicProcedure
    .input(z.string().cuid())
    .mutation(async ({ ctx, input }) => {
      try {
        //check if feature exists
        const feature = await ctx.prisma.feature.findUnique({
          where: {
            id: input,
          },
        });

        if (!feature) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Feature does not exist",
          });
        }

        await ctx.prisma.feature.delete({
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
    .input(featureInputSchema)
    .mutation(async ({ ctx, input }) => {
      //check if feature already exists
      const features = await ctx.prisma.feature.findMany({
        select: {
          title: true,
        },
      });

      const featureExists = features.find(
        (p) => p.title.toLowerCase() === input.title.toLowerCase()
      );

      if (featureExists) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Feature already exists",
        });
      }

      const { title, description, dateLearned, dateReviewed, techId } = input;
      try {
        const feature = await ctx.prisma.feature.create({
          data: {
            title,
            description,
            dateLearned,
            dateReviewed,
            Tech: {
              connect: {
                id: techId,
              },
            },
          },
        });
        return feature;
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
  update: publicProcedure
    .input(z.object({ id: z.string().cuid(), data: featureInputSchema }))
    .mutation(async ({ ctx, input }) => {
      const { id, data } = input;

      try {
        //check if feature exists
        const features = await ctx.prisma.feature.findMany({
          select: {
            title: true,
            id: true,
          },
        });

        const existingFeature = features.find(
          (p) => p.title.toLowerCase() === input.data.title.toLowerCase()
        );

        if (existingFeature && existingFeature.id !== id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Feature with this name already exists",
          });
        }

        const feature = await ctx.prisma.feature.update({
          where: {
            id,
          },
          data: {
            title: data.title,
            description: data.description,
            dateLearned: data.dateLearned,
            dateReviewed: data.dateReviewed,
            Tech: {
              connect: {
                id: data.techId,
              },
            },
          },
        });
        return feature;
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
