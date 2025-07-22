import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Outlet, RouterProvider } from "@tanstack/react-router";
import React from "react";
import { vi } from "vitest";
import { render } from "vitest-browser-react";

import { messages } from "../../src/locales/en/messages.po";

i18n.load({
    en: messages,
});
i18n.activate("en");

// Mock AI Model type
export interface MockAgentModel {
    maxTokens: number;
    name: string;
    provider: string;
    temperature: number;
}

// Mock Convex client
export const createMockConvexClient = () => {
    return {
        action: vi.fn(),
        mutation: vi.fn(),
        query: vi.fn(),
        subscribe: vi.fn(),
    };
};

// Mock AI Model
export const createMockAgentModel = (): MockAgentModel => {
    return {
        maxTokens: 4096,
        name: "test-model",
        provider: "test-provider",
        temperature: 0.7,
    };
};

// Simple test wrapper without ThreadProvider to avoid dependency issues
interface TestProvidersProperties {
    children: React.ReactNode;
    initialRoute?: string;
    queryClient?: QueryClient;
}

export const TestProviders: React.FC<TestProvidersProperties> = ({ children, initialRoute = "/", queryClient }) => {
    const rootRoute = createRootRoute({
        component: () => (
            <>
                <div data-testid="root-layout" />
                <Outlet />
            </>
        ),
    });

    const indexRoute = createRoute({
        component: () => <div data-testid="index-route">Index</div>,
        getParentRoute: () => rootRoute,
        path: "/",
    });

    const chatRoute = createRoute({
        component: () => <div data-testid="chat-route">{children}</div>,
        getParentRoute: () => rootRoute,
        path: "/chat",
    });

    const threadRoute = createRoute({
        component: () => <div data-testid="thread-route">{children}</div>,
        getParentRoute: () => rootRoute,
        path: "/chat/$threadId",
    });

    const router = createRouter({
        defaultPendingMinMs: 0,
        history: createMemoryHistory({ initialEntries: [initialRoute] }),
        routeTree: rootRoute.addChildren([indexRoute, chatRoute, threadRoute]),
    });

    let tree = (
        <I18nProvider i18n={i18n}>
            <RouterProvider router={router}>{children}</RouterProvider>
        </I18nProvider>
    );

    if (queryClient) {
        tree = <QueryClientProvider client={queryClient}>{tree}</QueryClientProvider>;
    }

    return tree;
};

// Render with basic providers
export const renderWithProviders = (
    Component: React.ComponentType,
    options: {
        initialRoute?: string;
        queryClient?: QueryClient;
    } = {},
) =>
    render(
        <TestProviders {...options}>
            <Component />
        </TestProviders>,
    );

// Mock fetch for streaming responses
export const mockStreamingFetch = (chunks: string[], delay = 10) => {
    const encoder = new TextEncoder();

    return vi.fn().mockImplementation(() => {
        const stream = new ReadableStream({
            start(controller) {
                chunks.forEach((chunk, index) => {
                    setTimeout(
                        () => {
                            controller.enqueue(encoder.encode(chunk));

                            if (index === chunks.length - 1) {
                                controller.close();
                            }
                        },
                        delay * (index + 1),
                    );
                });
            },
        });

        return Promise.resolve({
            body: stream,
            ok: true,
            status: 200,
        });
    });
};

// Mock WebSocket for real-time updates
export const createMockWebSocket = () => {
    const mockWs = {
        addEventListener: vi.fn(),
        close: vi.fn(),
        CLOSED: WebSocket.CLOSED,
        CLOSING: WebSocket.CLOSING,
        CONNECTING: WebSocket.CONNECTING,
        OPEN: WebSocket.OPEN,
        readyState: WebSocket.OPEN,
        removeEventListener: vi.fn(),
        send: vi.fn(),
    };

    return mockWs;
};

// Wait for async operations to complete
export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0));

// Mock performance.now for consistent timing in tests
export const mockPerformanceNow = () => {
    let time = 0;

    return vi.fn(() => {
        time += 16; // Simulate 60fps

        return time;
    });
};

// Helper to wait for element to appear in browser tests
export const waitForElement = async (testId: string, timeout = 5000) => {
    const start = Date.now();

    while (Date.now() - start < timeout) {
        try {
            const element = document.querySelector(`[data-testid="${testId}"]`);

            if (element) {
                return element;
            }
        } catch {
            // Element not found yet, continue waiting
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(`Element with testId "${testId}" not found within ${timeout}ms`);
};
