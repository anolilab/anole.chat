import { createAuth } from "@anole/convex/auth";
import ScreenSizeDebug from "@anole/ui/components/screen-size-debug";
import { Toaster } from "@anole/ui/components/sonner";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { fetchSession, getCookieName } from "@convex-dev/better-auth/react-start";
import type { ConvexQueryClient } from "@convex-dev/react-query";
import { useLingui } from "@lingui/react/macro";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, HeadContent, Outlet, Scripts, useRouteContext, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getCookie, getWebRequest } from "@tanstack/react-start/server";
import type { ConvexReactClient } from "convex/react";
import { ThemeProvider } from "next-themes";
import { lazy, Suspense } from "react";

import { ReactScan } from "@/components/debug/react-scan";
import { AuthQueryProvider } from "@/features/auth/lib/auth-query-provider";
import { AuthUIProviderTanstack } from "@/features/auth/lib/tanstack/auth-ui-provider-tanstack";
import { authClient } from "@/lib/auth/client";
import { env } from "@/lib/env";
import { DEFAULT_LOCALE } from "@/lib/intl/client";
import { seo } from "@/lib/seo";

import appCss from "../styles.css?url";

const ReactQueryDevtools = lazy(() =>
    import("@tanstack/react-query-devtools").then((m) => {
        return { default: m.ReactQueryDevtools };
    }),
);
const TanStackRouterDevtools = lazy(() =>
    import("@tanstack/react-router-devtools").then((m) => {
        return { default: m.TanStackRouterDevtools };
    }),
);

interface MyRouterContext {
    convexClient: ConvexReactClient;
    convexQueryClient: ConvexQueryClient;
    queryClient: QueryClient;
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
    ssr: true,
    component: () => <RootDocument />,
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
    wrapInSuspense: true,
});

const RootDocument = () => {
    const context = useRouteContext({ from: Route.id });
    const router = useRouter();
    const { i18n } = useLingui();

    return (
        <html lang={i18n.locale ?? DEFAULT_LOCALE} suppressHydrationWarning>
            <head>
                <HeadContent />
            </head>
            <body className="isolate min-h-svh w-full overflow-hidden" suppressHydrationWarning>
                <ConvexBetterAuthProvider authClient={authClient} client={context.convexClient}>
                    <AuthQueryProvider>
                        <AuthUIProviderTanstack
                            apiKey={{
                                metadata: {
                                    environment: "production",
                                    version: "v1",
                                },
                                prefix: "app_",
                            }}
                            authClient={authClient}
                            navigate={(href) => {
                                router.navigate({ to: href });
                            }}
                            onSessionChange={() => {
                                router.invalidate();
                            }}
                            persistClient={false}
                            replace={(href) => {
                                router.navigate({ replace: true, to: href });
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
