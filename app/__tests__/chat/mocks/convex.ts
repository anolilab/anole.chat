import { vi } from "vitest";

import type { ConvexMessage } from "@/features/chat/providers/types";

import { createMockConvexAssistantMessage, createMockConvexMessage } from "../factories";

// Mock Convex client
export const mockConvexClient = {
    action: vi.fn(),
    close: vi.fn(),
    mutation: vi.fn(),
    query: vi.fn(),
    subscribe: vi.fn(),
};

// Mock Convex React hooks
export const mockUseQuery = vi.fn();
export const mockUseMutation = vi.fn();
export const mockUsePaginatedQuery = vi.fn();
export const mockUseConvex = vi.fn(() => mockConvexClient);

// Mock thread messages response
export const createMockThreadMessagesResponse = (messages: ConvexMessage[] = []) => {
    return {
        isLoading: false,
        loadMore: vi.fn(),
        results: messages,
        status: "success" as const,
    };
};

// Mock threads response
export const createMockThreadsResponse = (threads: any[] = []) => {
    return {
        isLoading: false,
        loadMore: vi.fn(),
        results: threads,
        status: "success" as const,
    };
};

// Mock paginated query response
export const createMockPaginatedResponse = (items: any[] = []) => {
    return {
        isLoading: false,
        loadMore: vi.fn(),
        results: items,
        status: "success" as const,
    };
};

// Mock Convex mutations
export const mockCreateThreadMutation = vi.fn().mockResolvedValue("new-thread-id");
export const mockDeleteThreadMutation = vi.fn().mockResolvedValue(undefined);
export const mockBranchThreadMutation = vi.fn().mockResolvedValue("branch-thread-id");

// Mock thread data
export const createMockThread = (overrides?: any) => {
    return {
        _creationTime: Date.now(),
        _id: "thread-123",
        model: "test-model",
        parentThreadIds: [],
        status: "active",
        title: "Test Thread",
        userId: "user-123",
        ...overrides,
    };
};

// Mock message data for Convex
export const createMockConvexMessageList = (count: number = 3): ConvexMessage[] => {
    const messages: ConvexMessage[] = [];

    for (let index = 0; index < count; index++) {
        if (index % 2 === 0) {
            messages.push(
                createMockConvexMessage({
                    message: {
                        content: `User message ${index + 1}`,
                        role: "user",
                    },
                }),
            );
        } else {
            messages.push(
                createMockConvexAssistantMessage({
                    message: {
                        content: `Assistant response ${index + 1}`,
                        role: "assistant",
                    },
                }),
            );
        }
    }

    return messages;
};

// Setup default mocks
export const setupConvexMocks = () => {
    mockUseQuery.mockReturnValue({
        data: createMockThreadsResponse([createMockThread()]),
        error: null,
        isLoading: false,
    });

    mockUseMutation.mockReturnValue(mockCreateThreadMutation);

    mockUsePaginatedQuery.mockReturnValue(createMockPaginatedResponse([createMockThread()]));

    // Mock the useThreadMessages hook
    vi.doMock("@convex-dev/agent/react", () => {
        return {
            useThreadMessages: vi.fn().mockReturnValue(createMockThreadMessagesResponse(createMockConvexMessageList())),
        };
    });
};

// Reset all mocks
export const resetConvexMocks = () => {
    mockConvexClient.query.mockReset();
    mockConvexClient.mutation.mockReset();
    mockConvexClient.action.mockReset();
    mockConvexClient.subscribe.mockReset();
    mockUseQuery.mockReset();
    mockUseMutation.mockReset();
    mockUsePaginatedQuery.mockReset();
    mockCreateThreadMutation.mockReset();
    mockDeleteThreadMutation.mockReset();
    mockBranchThreadMutation.mockReset();
};
