import { QueryClientProvider } from "@tanstack/react-query";
import {
	createHashHistory,
	createRouter as createTanStackRouter,
} from "@tanstack/react-router";

import { getQueryClient } from "./query-client";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
	const queryClient = getQueryClient();

	const router = createTanStackRouter({
		history: createHashHistory(),
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreload: "intent",
		// Let React Query own caching: always run loaders so they can hydrate the
		// query cache, and let staleTime decide whether a refetch actually happens.
		defaultPreloadStaleTime: 0,
		// Automatically wrap the whole app in the QueryClientProvider
		Wrap: ({ children }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		),
	});

	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
