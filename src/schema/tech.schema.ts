import { z } from "zod";

export const techInputSchema = z.object({
  name: z
    .string()
    .min(2, "Name needs to be at least 2 characters")
    .max(50, "Name can't be longer than 50 characters"),
  description: z
    .string()
    .min(10, "Description needs to be at least 10 characters")
    .max(500, "Description can't be longer than 500 characters"),
  icon: z.string().nullish(),
  url: z.string().url("URL is not valid"),
});

export type TechInput = z.infer<typeof techInputSchema>;