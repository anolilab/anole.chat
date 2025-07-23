import { vi } from "vitest";

// Mock TanStack Router
export const mockUseNavigate = vi.fn(() => vi.fn());
export const mockCreateMemoryHistory = vi.fn();
export const mockCreateRouter = vi.fn();

// Mock Lingui
export const mockT = vi.fn((template: any) => {
    if (typeof template === "string") {
        return template;
    }

    if (template && template.id) {
        return template.id;
    }

    return "Mocked translation";
});

// Mock Sonner toast
export const mockToast = {
    dismiss: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
};

// Mock logger
export const mockLogger = {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    performance: vi.fn(),
    stream: vi.fn(),
    thread: vi.fn(),
    update: vi.fn(),
    warn: vi.fn(),
};

export const mockProviderLogger = mockLogger;
export const mockHandlerLogger = mockLogger;
export const mockThreadLogger = mockLogger;
export const mockStreamLogger = mockLogger;

// Mock performance monitoring functions
export const mockLogStreamStart = vi.fn();
export const mockLogStreamComplete = vi.fn();
export const mockLogMessageUpdate = vi.fn();
export const mockLogThreadLoad = vi.fn();
export const mockLogThreadUpdate = vi.fn();

// Mock assistant-stream
export const mockAssistantMessageAccumulator = vi.fn(() => {
    return {
        pipeThrough: vi.fn().mockReturnThis(),
    };
});

export const mockDataStreamDecoder = vi.fn(() => {
    return {
        pipeThrough: vi.fn().mockReturnThis(),
    };
});

export const mockAsAsyncIterableStream = vi.fn(function* (stream: any) {
    yield { parts: [{ text: "Test response", type: "text" }] };
});

// Mock fetch for streaming
export const mockFetch = vi.fn();

// Mock AbortController
export const mockAbortController = {
    abort: vi.fn(),
    signal: { aborted: false },
};

// Mock performance.now
export const mockPerformanceNow = vi.fn(() => Date.now());

// Setup all external dependency mocks
export const setupExternalMocks = () => {
    // Mock TanStack Router
    vi.doMock("@tanstack/react-router", () => {
        return {
            createMemoryHistory: mockCreateMemoryHistory,
            createRouter: mockCreateRouter,
            useNavigate: mockUseNavigate,
        };
    });

    // Mock Lingui
    vi.doMock("@lingui/core/macro", () => {
        return {
            t: mockT,
        };
    });

    // Mock Sonner
    vi.doMock("sonner", () => {
        return {
            toast: mockToast,
        };
    });

    // Mock logger
    vi.doMock("@/lib/logger", () => {
        return {
            handlerLogger: mockHandlerLogger,
            logMessageUpdate: mockLogMessageUpdate,
            logStreamComplete: mockLogStreamComplete,
            logStreamStart: mockLogStreamStart,
            logThreadLoad: mockLogThreadLoad,
            logThreadUpdate: mockLogThreadUpdate,
            providerLogger: mockProviderLogger,
            streamLogger: mockStreamLogger,
            threadLogger: mockThreadLogger,
        };
    });

    // Mock assistant-stream
    vi.doMock("assistant-stream", () => {
        return {
            AssistantMessageAccumulator: mockAssistantMessageAccumulator,
            DataStreamDecoder: mockDataStreamDecoder,
        };
    });

    vi.doMock("assistant-stream/utils", () => {
        return {
            asAsyncIterableStream: mockAsAsyncIterableStream,
        };
    });

    // Mock global fetch
    globalThis.fetch = mockFetch;

    // Mock AbortController
    globalThis.AbortController = vi.fn(() => mockAbortController) as any;

    // Mock performance.now
    globalThis.performance = { now: mockPerformanceNow } as any;
};

// Reset all external mocks
export const resetExternalMocks = () => {
    mockUseExternalStoreRuntime.mockReset();
    mockUseNavigate.mockReset();
    mockT.mockReset();
    Object.values(mockToast).forEach((function_) => function_.mockReset());
    Object.values(mockLogger).forEach((function_) => function_.mockReset());
    mockLogStreamStart.mockReset();
    mockLogStreamComplete.mockReset();
    mockLogMessageUpdate.mockReset();
    mockLogThreadLoad.mockReset();
    mockLogThreadUpdate.mockReset();
    mockAssistantMessageAccumulator.mockReset();
    mockDataStreamDecoder.mockReset();
    mockAsAsyncIterableStream.mockReset();
    mockFetch.mockReset();
    mockAbortController.abort.mockReset();
    mockPerformanceNow.mockReset();
};
