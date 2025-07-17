import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "vitest-browser-react";

// Cleanup after each test
afterEach(() => {
    cleanup();
});

// Mock global objects that might not be available in test environment
beforeEach(() => {
    // Mock ResizeObserver
    globalThis.ResizeObserver = vi.fn().mockImplementation(() => {
        return {
            disconnect: vi.fn(),
            observe: vi.fn(),
            unobserve: vi.fn(),
        };
    });

    // Mock IntersectionObserver
    globalThis.IntersectionObserver = vi.fn().mockImplementation(() => {
        return {
            disconnect: vi.fn(),
            observe: vi.fn(),
            unobserve: vi.fn(),
        };
    });

    // Mock matchMedia
    Object.defineProperty(globalThis, "matchMedia", {
        value: vi.fn().mockImplementation((query) => {
            return {
                addEventListener: vi.fn(),
                addListener: vi.fn(), // deprecated
                dispatchEvent: vi.fn(),
                matches: false,
                media: query,
                onchange: null,
                removeEventListener: vi.fn(),
                removeListener: vi.fn(), // deprecated
            };
        }),
        writable: true,
    });

    // Mock scrollTo
    window.scrollTo = vi.fn();

    // Mock localStorage
    const localStorageMock = {
        clear: vi.fn(),
        getItem: vi.fn(),
        removeItem: vi.fn(),
        setItem: vi.fn(),
    };

    Object.defineProperty(globalThis, "localStorage", {
        value: localStorageMock,
    });

    // Mock sessionStorage
    Object.defineProperty(globalThis, "sessionStorage", {
        value: localStorageMock,
    });
});
