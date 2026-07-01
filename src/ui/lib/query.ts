import type { Category } from "#/electron/db/types";
import { queryOptions } from "@tanstack/react-query";

export const categoriesQueryOptions = queryOptions<Category[]>({
  queryKey: ["categories"],
  queryFn: () => window.api.categories.get(),
});
