import { ErrorComponent, createRouter as createTanstackRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexProvider } from "convex/react";
import { ConvexReactClient } from "convex/react";
import { AnalyticsProvider } from "@/providers/analytics-provider";
import { ConvexQueryCacheProvider } from "convex-helpers/react/cache";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

import "./styles.css";
import DefaultLoading from "./components/default-loading";
import NotFound from "./components/not-found";
import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GlobalErrorBoundaryProvider } from "@/components/error-boundaries/global-error-boundary-provider";
import type { I18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { env } from "@/lib/env";
import type { ReactNode } from "react";

export const createRouter = ({ i18n }: { i18n: I18n }) => {
    const convex = new ConvexReactClient(env.VITE_CONVEX_URL, {
        unsavedChangesWarning: false,
        //verbose: import.meta.env.VITE_DEBUG,
        logger: true,
        reportDebugInfoToConvex: import.meta.env.VITE_DEBUG,
    });
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

    return routerWithQueryClient(
        createTanstackRouter({
            routeTree,
            context: {
                queryClient,
                convexClient: convex,
                convexQueryClient,
            },
            scrollRestoration: true,
            defaultPreloadStaleTime: 0,
            defaultStaleTime: 0,
            defaultPreload: "intent",
            defaultViewTransition: true,
            defaultPendingComponent: DefaultLoading,
            defaultNotFoundComponent: NotFound,
            defaultErrorComponent: ({ error }) => <ErrorComponent error={error} />,
            Wrap: (props: { children: ReactNode }) => {
                return (
                    <GlobalErrorBoundaryProvider>
                        <I18nProvider i18n={i18n}>
                            <AnalyticsProvider>
                                <ConvexProvider client={convexQueryClient.convexClient}>
                                    <QueryClientProvider client={queryClient}>
                                        <ConvexQueryCacheProvider>{props.children}</ConvexQueryCacheProvider>
                                    </QueryClientProvider>
                                </ConvexProvider>
                            </AnalyticsProvider>
                        </I18nProvider>
                    </GlobalErrorBoundaryProvider>
                );
            },
        }),
        queryClient,
    );
};

// Register the router instance for type safety
declare module "@tanstack/react-router" {
    interface Register {
        router: ReturnType<typeof createRouter>;
    }
}
