import { vi } from "vitest";

import { setupAllMocks } from "./mocks";

// Global test setup for chat tests
export const setupChatTests = () => {
    // Setup all mocks before each test
    beforeEach(() => {
        setupAllMocks();

        // Mock console methods to reduce noise in tests
        vi.spyOn(console, "warn").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
        vi.spyOn(console, "log").mockImplementation(() => {});

        // Mock timers for consistent testing
        vi.useFakeTimers();
    });

    afterEach(() => {
        // Restore all mocks
        vi.restoreAllMocks();

        // Clear all timers
        vi.clearAllTimers();
        vi.useRealTimers();
    });
};

// Helper to advance timers in tests
export const advanceTimers = (ms: number) => {
    vi.advanceTimersByTime(ms);
};

// Helper to flush all pending promises
export const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

// Helper to wait for next tick
export const nextTick = () => new Promise((resolve) => process.nextTick(resolve));
