import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { ReactScan } from "@/components/react-scan";

import appCss from "../styles.css?url";

import type { QueryClient } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/sonner";
import { seo } from "@/lib/seo";

import { ThemeProvider } from "next-themes";
import React from "react";
import type { ConvexReactClient } from "convex/react";

interface MyRouterContext {
    queryClient: QueryClient;
    convex: ConvexReactClient;
}

const TanStackRouterDevtools = import.meta.env.PROD
    ? () => null
    : React.lazy(() =>
          import("@tanstack/react-router-devtools").then((res) => ({
              default: res.TanStackRouterDevtools,
          })),
      );

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
    component: () => <RootDocument />,
    wrapInSuspense: true,
    ssr: false,
});

const RootDocument = () => {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <HeadContent />
            </head>
            <body suppressHydrationWarning>
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                        <Outlet />
                        <Toaster />
                        <Scripts />
                </ThemeProvider>
                {import.meta.env.DEBUG && <>
                    <TanStackRouterDevtools position="top-right" />
                    <ReactScan />
                </>}
            </body>
        </html>
    );
};
