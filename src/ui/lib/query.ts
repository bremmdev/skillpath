import type { Category, SkillTreeCategory } from "#/electron/db/types";
import { queryOptions } from "@tanstack/react-query";

export const categoriesQueryOptions = queryOptions<Category[]>({
  queryKey: ["categories"],
  queryFn: () => window.api.categories.get(),
});

export const skillTreeQueryOptions = queryOptions<SkillTreeCategory[]>({
  queryKey: ["skillTree"],
  queryFn: () => window.api.skillTree.get(),
});
