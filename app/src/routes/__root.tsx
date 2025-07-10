import { HeadContent, Outlet, Scripts, createRootRouteWithContext, useRouteContext, useRouter } from "@tanstack/react-router";
import { ReactScan } from "@/components/react-scan";

import type { QueryClient } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/sonner";
import { seo } from "@/lib/seo";

import { ThemeProvider } from "next-themes";
import { Suspense, lazy } from "react";
import type { ConvexReactClient } from "convex/react";
import { getCookie, getWebRequest } from "@tanstack/react-start/server";
import { authClient } from "@/lib/auth/client";
import { fetchSession, getCookieName } from "@convex-dev/better-auth/react-start";
import { createServerFn } from "@tanstack/react-start";
import type { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { DEFAULT_LOCALE } from "@/lib/intl/client";
import { i18n } from "@lingui/core";
import ScreenSizeDebug from "@/components/screen-size-debug";
import { AuthQueryProvider } from "@/features/auth/lib/auth-query-provider";
import { AuthUIProviderTanstack } from "@/features/auth/lib/tanstack/auth-ui-provider-tanstack";
import { Link } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { createAuth } from "@anole/convex/auth";
import { env } from "@/lib/env";

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

    const { session } = await fetchSession(request, {
        convexSiteUrl: env.VITE_CONVEX_SITE_URL,
    });

    return {
        token,
        ...session,
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
            { rel: "stylesheet", href: appCss },
            { rel: "icon", href: "/favicon.ico" },
        ],
    }),
    beforeLoad: async (ctx) => {
        const auth = await ctx.context.queryClient.fetchQuery({
            queryKey: ["session"],
            queryFn: ({ signal }) => fetchAuth({ signal }),
        });

        const { user, session, token } = auth;

        // During SSR only (the only time serverHttpClient exists),
        // set the auth token to make HTTP queries with.
        if (token) {
            ctx.context.convexQueryClient.serverHttpClient?.setAuth(token);
        }

        // transform all time strings to date objects
        if (user) {
            user.createdAt = new Date(user.createdAt);
            user.updatedAt = new Date(user.updatedAt);
        }

        if (session) {
            session.createdAt = new Date(session.createdAt);
            session.updatedAt = new Date(session.updatedAt);
            session.expiresAt = new Date(session.expiresAt);
        }

        return {
            user,
            session,
            token,
        };
    },
    component: () => <RootDocument />,
    wrapInSuspense: true,
    ssr: true,
});

const RootDocument = () => {
    const context = useRouteContext({ from: Route.id });
    const router = useRouter();

    return (
        <html lang={i18n.locale ?? DEFAULT_LOCALE} suppressHydrationWarning>
            <head>
                <HeadContent />
            </head>
            <body suppressHydrationWarning className="isolate min-h-svh w-full overflow-hidden">
                <ConvexBetterAuthProvider client={context.convexClient} authClient={authClient}>
                    <AuthQueryProvider>
                        <AuthUIProviderTanstack
                            authClient={authClient}
                            navigate={(href) => {
                                router.navigate({ to: href });
                            }}
                            replace={(href) => {
                                router.navigate({ to: href, replace: true });
                            }}
                            onSessionChange={() => {
                                router.invalidate();
                            }}
                            persistClient={false}
                            Link={({ href, ...props }) => <Link to={href} {...props} />}
                            apiKey={{
                                prefix: "app_",
                                metadata: {
                                    environment: "production",
                                    version: "v1",
                                },
                            }}
                            twoFactor={["totp"]}
                        >
                            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                                <ScreenSizeDebug />
                                <Outlet />
                                <Toaster />
                                <Scripts />
                            </ThemeProvider>
                        </AuthUIProviderTanstack>
                    </AuthQueryProvider>
                </ConvexBetterAuthProvider>
                {import.meta.env.VITE_DEBUG === "true" && (
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
