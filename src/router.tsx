import { ErrorComponent, createRouter as createTanstackRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

import "./styles.css";
import DefaultLoading from "./components/default-loading";
import NotFound from "./components/not-found";
import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";

export const createRouter = () => {
    const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL!;

    if (!CONVEX_URL) {
        console.error("missing envar VITE_CONVEX_URL");
    }

    const convex = new ConvexReactClient(CONVEX_URL);
    const convexQueryClient = new ConvexQueryClient(convex);

    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                queryKeyHashFn: convexQueryClient.hashFn(),
                queryFn: convexQueryClient.queryFn(),
            },
        },
        queryCache: new QueryCache(),
    });

    convexQueryClient.connect(queryClient);

    const router = routerWithQueryClient(
        createTanstackRouter({
            routeTree,
            context: {
                queryClient,
            },
            scrollRestoration: true,
            defaultPreloadStaleTime: 0,
            defaultStaleTime: 0,
            defaultPreload: "intent",
            defaultViewTransition: true,
            defaultPendingComponent: DefaultLoading,
            defaultNotFoundComponent: NotFound,
            defaultErrorComponent: ({ error }) => <ErrorComponent error={error} />,
            Wrap: (props: { children: React.ReactNode }) => {
                return (
                    <ConvexAuthProvider client={convex}>
                        <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>
                    </ConvexAuthProvider>
                );
            },
        }),
        queryClient,
    );

    return router;
};

// Register the router instance for type safety
declare module "@tanstack/react-router" {
    interface Register {
        router: ReturnType<typeof createRouter>;
    }
}
