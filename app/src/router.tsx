import "./styles.css";

import { ConvexQueryClient } from "@convex-dev/react-query";
import type { I18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter as createTanstackRouter, ErrorComponent } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexQueryCacheProvider } from "convex-helpers/react/cache";
import type { ReactNode } from "react";

import { GlobalErrorBoundaryProvider } from "@/components/error-boundaries/global-error-boundary-provider";
import { env } from "@/lib/env";
import { AnalyticsProvider } from "@/providers/analytics-provider";

import DefaultLoading from "@/components/default-loading";
import NotFound from "@/components/not-found";
// Import the generated route tree
import { routeTree } from "./routeTree.gen";

export const createRouter = ({ i18n }: { i18n: I18n }) => {
    const convex = new ConvexReactClient(env.VITE_CONVEX_URL, {
        // verbose: import.meta.env.VITE_DEBUG,
        logger: true,
        reportDebugInfoToConvex: import.meta.env.VITE_DEBUG,
        unsavedChangesWarning: false,
    });
    const convexQueryClient = new ConvexQueryClient(convex);

    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                queryFn: convexQueryClient.queryFn(),
                queryKeyHashFn: convexQueryClient.hashFn(),
            },
        },
        queryCache: new QueryCache(),
    });

    convexQueryClient.connect(queryClient);

    return routerWithQueryClient(
        createTanstackRouter({
            context: {
                convexClient: convex,
                convexQueryClient,
                queryClient,
            },
            defaultErrorComponent: ({ error }) => <ErrorComponent error={error} />,
            defaultNotFoundComponent: NotFound,
            defaultPendingComponent: DefaultLoading,
            defaultPreload: "intent",
            defaultPreloadStaleTime: 0,
            defaultStaleTime: 0,
            defaultViewTransition: true,
            routeTree,
            scrollRestoration: true,
            Wrap: (properties: { children: ReactNode }) => (
                <GlobalErrorBoundaryProvider>
                    <I18nProvider i18n={i18n}>
                        <AnalyticsProvider>
                            <ConvexProvider client={convexQueryClient.convexClient}>
                                <QueryClientProvider client={queryClient}>
                                    <ConvexQueryCacheProvider>{properties.children}</ConvexQueryCacheProvider>
                                </QueryClientProvider>
                            </ConvexProvider>
                        </AnalyticsProvider>
                    </I18nProvider>
                </GlobalErrorBoundaryProvider>
            ),
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
