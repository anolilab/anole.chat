// Re-export all mocks for easy importing
import { resetConvexMocks, setupConvexMocks } from "./convex";
import { resetExternalMocks, setupExternalMocks } from "./external-dependencies";

export * from "./convex";
export * from "./external-dependencies";

// Setup all mocks
export const setupAllMocks = () => {
    setupConvexMocks();
    setupExternalMocks();
};

// Reset all mocks
export const resetAllMocks = () => {
    resetConvexMocks();
    resetExternalMocks();
};

// Mock setup for individual test files
export const setupTestMocks = () => {
    beforeEach(() => {
        setupAllMocks();
    });

    afterEach(() => {
        resetAllMocks();
    });
};
