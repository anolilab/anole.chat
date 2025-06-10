import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { ReactScan } from "@/components/react-scan";

import appCss from "../styles.css?url";

import type { QueryClient } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/sonner";
import { seo } from "@/lib/seo";

import i18n from "@/lib/intl/i18n";
import { ThemeProvider } from "next-themes";
import React from "react";
import { I18nextProvider } from "react-i18next";

interface MyRouterContext {
    queryClient: QueryClient;
}

const TanStackRouterDevtools =
    process.env.NODE_ENV === "production"
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

function RootDocument() {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <HeadContent />
            </head>
            <body suppressHydrationWarning>
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                    <I18nextProvider i18n={i18n} defaultNS={"translation"}>
                        <Outlet />
                        <Toaster />
                        <TanStackRouterDevtools position="top-right" />
                        <Scripts />
                    </I18nextProvider>
                </ThemeProvider>
                <ReactScan />
            </body>
        </html>
    );
}
