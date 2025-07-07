import { HeadContent, Outlet, Scripts, createRootRouteWithContext, useRouteContext } from "@tanstack/react-router";
import { ReactScan } from "@/components/react-scan";

import appCss from "../styles.css?url";

import type { QueryClient } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/sonner";
import { seo } from "@/lib/seo";

import { ThemeProvider } from "next-themes";
import { Suspense, lazy } from "react";
import type { ConvexReactClient } from "convex/react";
import { createAuth } from "@cvx/auth";
import { getCookie, getWebRequest } from "@tanstack/react-start/server";
import { fetchSession, getCookieName } from "@convex-dev/better-auth/react-start";
import { createServerFn } from "@tanstack/react-start";
import type { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { authClient } from "@/lib/auth/client";
import { DEFAULT_LOCALE } from "@/lib/intl/client";
import { i18n } from "@lingui/core";
import ScreenSizeDebug from "@/components/screen-size-debug";

const ReactQueryDevtools = lazy(() => import("@tanstack/react-query-devtools").then((m) => ({ default: m.ReactQueryDevtools })));
const TanStackRouterDevtools = lazy(() => import("@tanstack/react-router-devtools").then((m) => ({ default: m.TanStackRouterDevtools })));

interface MyRouterContext {
    queryClient: QueryClient;
    convexClient: ConvexReactClient;
    convexQueryClient: ConvexQueryClient;
}

const fetchAuth = createServerFn({ method: "GET" }).handler(async () => {
    const sessionCookieName = await getCookieName(createAuth);
    const token = getCookie(sessionCookieName);
    const request = getWebRequest();
    const { session } = await fetchSession(createAuth, request);

    return {
        userId: session?.user.id,
        token,
    };
});

export const Route = createRootRouteWithContext<MyRouterContext>()({
    head: () => ({
        meta: [
            {
                charSet: "utf-8",
            },
            {
                name: "viewport",
                content: "width=device-width, initial-scale=1",
            },
            ...seo({
                title: "Modern Ai Chat",
                description: "",
                keywords: "Ai Chat",
            }),
        ],
        links: [
            {
                rel: "stylesheet",
                href: appCss,
            },
        ],
    }),
    beforeLoad: async (ctx) => {
        const auth = await fetchAuth();

        const { userId, token } = auth;

        // During SSR only (the only time serverHttpClient exists),
        // set the auth token to make HTTP queries with.
        if (token) {
            ctx.context.convexQueryClient.serverHttpClient?.setAuth(token);
        }

        return {
            userId,
            token,
        };
    },
    component: () => <RootDocument />,
    wrapInSuspense: true,
    ssr: false,
});

const RootDocument = () => {
    const context = useRouteContext({ from: Route.id });

    return (
        <html lang={i18n.locale ?? DEFAULT_LOCALE} suppressHydrationWarning>
            <head>
                <HeadContent />
            </head>
            <body suppressHydrationWarning className="isolate min-h-svh w-full overflow-hidden">
                <ConvexBetterAuthProvider client={context.convexClient} authClient={authClient}>
                    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                        <ScreenSizeDebug />
                        <Outlet />
                        <Toaster />
                        <Scripts />
                    </ThemeProvider>
                </ConvexBetterAuthProvider>
                {import.meta.env.VITE_DEBUG && (
                    <Suspense fallback={null}>
                        <TanStackRouterDevtools position="bottom-right" />
                        <ReactQueryDevtools buttonPosition="bottom-left" />
                        <ReactScan />
                    </Suspense>
                )}
            </body>
        </html>
    );
};
