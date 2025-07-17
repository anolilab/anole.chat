import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Outlet, RouterProvider } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import React from "react";

type RenderOptions = {
    initialEntry?: string;
    pathPattern: string;
    queryClient?: QueryClient;
};

/**
 * Renders a component under:
 * - a minimal TanStack Router instance (memory history),
 * - optionally wrapped in a QueryClientProvider.
 *
 * If `initialEntry` is omitted, it defaults to `pathPattern`.
 * @param Component The React component to mount.
 * @param opts Render options.
 * @returns { router, renderResult }
 */

export async function renderWithProviders(Component: React.ComponentType, { pathPattern, initialEntry = pathPattern, queryClient }: RenderOptions) {
    // Root route with minimal Outlet for rendering child routes
    const rootRoute = createRootRoute({
        component: () => (
            <>
                <div data-testid="root-layout" />
                <Outlet />
            </>
        ),
    });

    // Index route so '/' always matches
    const indexRoute = createRoute({
        component: () => <div>Index</div>,
        getParentRoute: () => rootRoute,
        path: "/",
    });

    // Test route mounting your Component at the dynamic path
    const testRoute = createRoute({
        component: () => <Component />,
        getParentRoute: () => rootRoute,
        path: pathPattern,
    });

    // Create the router instance with memory history
    const router = createRouter({
        defaultPendingMinMs: 0,
        history: createMemoryHistory({ initialEntries: [initialEntry] }),
        routeTree: rootRoute.addChildren([indexRoute, testRoute]),
    });

    // Build the render tree and add QueryClientProvider if provided
    let tree = <RouterProvider router={router} />;

    if (queryClient) {
        tree = <QueryClientProvider client={queryClient}>{tree}</QueryClientProvider>;
    }

    // Render and wait for the route to resolve and the component to mount
    const renderResult = render(tree);

    await screen.findByTestId("root-layout");

    return { renderResult, router };
}
