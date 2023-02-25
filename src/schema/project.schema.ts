import { z } from "zod";

export const projectInputSchema = z.object({
  title: z
    .string()
    .min(2, "Title needs to be at least 2 characters")
    .max(50, "Title can't be longer than 50 characters"),
  description: z
    .string()
    .min(10, "Description needs to be at least 10 characters")
    .max(500, "Description can't be longer than 500 characters"),
  repo: z.string().url("URL is not valid"),
  url: z.string().url("URL is not valid"),
  imageUrl: z.union([z.literal(""), z.string().url("URL is not valid")]),
  startDate: z.date(),
  tech: z.array(z.string()),
});

export type ProjectInput = z.infer<typeof projectInputSchema>;
