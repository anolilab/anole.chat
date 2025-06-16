import { ErrorComponent, createRouter as createTanstackRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexProviderWithAuth } from "convex/react";
import { ConvexReactClient } from "convex/react";
import { AnalyticsProvider } from "@/providers/analytics-provider";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

import "./styles.css";
import DefaultLoading from "./components/default-loading";
import NotFound from "./components/not-found";
import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GlobalErrorBoundaryProvider } from "@/components/error-boundaries/global-error-boundary-provider";
import { useAuthForConvex } from "./features/auth/lib/client";
import type { I18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";

export const createRouter = ({ i18n }: { i18n: I18n }) => {
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
                refetchOnWindowFocus: true,
                refetchOnReconnect: true,
                refetchOnMount: true,
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
                convex,
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
                    <I18nProvider i18n={i18n}>
                        <GlobalErrorBoundaryProvider>
                            <AnalyticsProvider>
                                <ConvexProviderWithAuth client={convexQueryClient.convexClient} useAuth={useAuthForConvex}>
                                    <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>
                                </ConvexProviderWithAuth>
                            </AnalyticsProvider>
                        </GlobalErrorBoundaryProvider>
                    </I18nProvider>
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
