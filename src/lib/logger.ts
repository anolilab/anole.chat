import { createPail } from "@visulima/pail";

// Create the main application logger
export const logger = createPail({
    scope: "ai-chat",
    types: {
        // Streaming performance loggers
        stream: {
            badge: "🚀",
            color: "cyan",
            label: "stream",
            logLevel: "debug",
        },
        performance: {
            badge: "⚡",
            color: "yellow",
            label: "perf",
            logLevel: "debug",
        },
        update: {
            badge: "📝",
            color: "blue",
            label: "update",
            logLevel: "debug",
        },
        connection: {
            badge: "🔄",
            color: "magenta",
            label: "connection",
            logLevel: "debug",
        },
        thread: {
            badge: "📥",
            color: "green",
            label: "thread",
            logLevel: "debug",
        },
        // UI interaction loggers
        user: {
            badge: "👤",
            color: "white",
            label: "user",
            logLevel: "info",
        },
        message: {
            badge: "💬",
            color: "gray",
            label: "message",
            logLevel: "info",
        },
        // Error and warning loggers
        network: {
            badge: "🌐",
            color: "orange",
            label: "network",
            logLevel: "warning",
        },
        abort: {
            badge: "⏹️",
            color: "red",
            label: "abort",
            logLevel: "warning",
        },
    },
});

// Create scoped loggers for different modules
export const streamLogger = logger.scope("streaming");
export const providerLogger = logger.scope("provider");
export const handlerLogger = logger.scope("handlers");
export const threadLogger = logger.scope("threads");

// Performance monitoring logger (can be disabled in production)
export const perfLogger = logger.scope("performance");

// Utility function to conditionally enable/disable debug logging
export const configureLogging = (isDevelopment: boolean) => {
    if (!isDevelopment) {
        // In production, disable debug-level loggers to reduce noise
        streamLogger.disable();
        perfLogger.disable();
        // Keep info/warning/error loggers enabled for production monitoring
    }
};

// Initialize logging based on environment
const isDevelopment = import.meta.env?.DEV || process.env.NODE_ENV === 'development';
configureLogging(isDevelopment);

// Helper functions for common logging patterns
export const logStreamStart = (threadId: string) => {
    streamLogger.stream("Starting ultra-optimized stream for thread: %s", threadId);
};

export const logStreamComplete = (threadId: string, stats: {
    duration: number;
    updates: number;
    avgUpdateInterval: number;
    charsPerSecond: number;
    finalTextLength: number;
}) => {
    streamLogger.performance(`Ultra-fast stream completed: ${threadId}
        📊 Duration: ${stats.duration.toFixed(1)}ms
        🔄 Updates: ${stats.updates}
        ⚡ Avg update interval: ${stats.avgUpdateInterval.toFixed(1)}ms
        🚀 Chars/second: ${stats.charsPerSecond.toFixed(0)}
        📝 Final text length: ${stats.finalTextLength} chars`);
};

export const logStreamUpdate = (length: number) => {
    streamLogger.update("Streaming update: %d chars", length);
};

export const logMessageUpdate = (messageId: string, length: number) => {
    handlerLogger.update("Updating message %s with %d chars", messageId, length);
};

export const logThreadLoad = (threadId: string, count: number) => {
    threadLogger.thread("Loading %d messages for thread: %s", count, threadId);
};

export const logThreadUpdate = (threadId: string, count: number) => {
    threadLogger.thread("Updated %d messages for thread: %s", count, threadId);
};

export const logConnectionRetry = (attempt: number, maxRetries: number, operationId: string, error: string) => {
    logger.connection("Retry attempt %d/%d for %s: %s", attempt, maxRetries, operationId, error);
};

export const logUserAction = (action: string, threadId: string) => {
    logger.user("%s called with currentThreadId: %s", action, threadId);
};

export const logNetworkError = (error: string) => {
    logger.network("Stream error: %s", error);
};

export const logStreamAbort = () => {
    logger.abort("Stream aborted by user");
};

export const logStreamCancel = () => {
    logger.abort("Stream cancelled by user");
};
