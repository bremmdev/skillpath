import { z } from "zod";

export const featureInputSchema = z
  .object({
    title: z
      .string()
      .min(2, "Title needs to be at least 2 characters")
      .max(50, "Title can't be longer than 50 characters"),
    description: z
      .string()
      .min(10, "Description needs to be at least 10 characters")
      .max(500, "Description can't be longer than 500 characters"),
    dateLearned: z.date(),
    dateReviewed: z.date().nullable(),
    techId: z.string().cuid(),
  })
  .refine(
    (data) =>
      data.dateReviewed ? data.dateLearned <= data.dateReviewed : true,
    {
      path: ["dateReviewed"],
      message: "Date must be after date reviewed",
    }
  );

export type FeatureInput = z.infer<typeof featureInputSchema>;
