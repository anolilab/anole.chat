/**
 * Advanced streaming optimizations for ultra-fast text rendering
 * Includes connection recovery, progressive loading, and performance monitoring
 */

// Performance monitoring for streaming operations
export class StreamingPerformanceMonitor {
    private metrics: Map<string, {
        startTime: number;
        updates: number;
        totalChars: number;
        avgUpdateInterval: number;
        lastUpdateTime: number;
    }> = new Map();

    startSession(sessionId: string): void {
        this.metrics.set(sessionId, {
            startTime: performance.now(),
            updates: 0,
            totalChars: 0,
            avgUpdateInterval: 0,
            lastUpdateTime: performance.now(),
        });
    }

    recordUpdate(sessionId: string, textLength: number): void {
        const session = this.metrics.get(sessionId);
        if (!session) return;

        const now = performance.now();
        session.updates++;
        session.totalChars = textLength;

        if (session.updates > 1) {
            const interval = now - session.lastUpdateTime;
            session.avgUpdateInterval = ((session.avgUpdateInterval * (session.updates - 2)) + interval) / (session.updates - 1);
        }

        session.lastUpdateTime = now;
    }

    endSession(sessionId: string): {
        duration: number;
        updates: number;
        charsPerSecond: number;
        avgUpdateInterval: number;
    } | null {
        const session = this.metrics.get(sessionId);
        if (!session) return null;

        const duration = performance.now() - session.startTime;
        const charsPerSecond = (session.totalChars / duration) * 1000;

        const result = {
            duration,
            updates: session.updates,
            charsPerSecond,
            avgUpdateInterval: session.avgUpdateInterval,
        };

        this.metrics.delete(sessionId);
        return result;
    }
}

// Connection recovery with exponential backoff
export class ConnectionRecoveryManager {
    private retryAttempts: Map<string, number> = new Map();
    private maxRetries = 3;
    private baseDelay = 1000; // 1 second

    async withRetry<T>(
        operation: () => Promise<T>,
        operationId: string,
        onRetry?: (attempt: number, error: Error) => void
    ): Promise<T> {
        let lastError: Error;
        const currentAttempts = this.retryAttempts.get(operationId) || 0;

        for (let attempt = currentAttempts; attempt < this.maxRetries; attempt++) {
            try {
                const result = await operation();
                this.retryAttempts.delete(operationId); // Reset on success
                return result;
            } catch (error) {
                lastError = error as Error;
                this.retryAttempts.set(operationId, attempt + 1);

                                if (attempt < this.maxRetries - 1) {
                    const delay = this.baseDelay * Math.pow(2, attempt);
                    // Note: onRetry callback handles the logging via Pail
                    onRetry?.(attempt + 1, lastError);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    // Final failure will be logged by the caller
                }
            }
        }

        throw lastError!;
    }

    reset(operationId: string): void {
        this.retryAttempts.delete(operationId);
    }

    getAttempts(operationId: string): number {
        return this.retryAttempts.get(operationId) || 0;
    }
}

// Progressive text loader for large messages
export class ProgressiveTextLoader {
    private loadedChunks: Map<string, string[]> = new Map();
    private chunkSize = 500; // Characters per chunk

    addChunk(messageId: string, text: string): boolean {
        const chunks = this.loadedChunks.get(messageId) || [];
        const newChunk = text.slice(chunks.join('').length);

        if (newChunk.length === 0) return false; // No new content

        // Split into chunks if needed
        if (newChunk.length > this.chunkSize) {
            const newChunks = [];
            for (let i = 0; i < newChunk.length; i += this.chunkSize) {
                newChunks.push(newChunk.slice(i, i + this.chunkSize));
            }
            chunks.push(...newChunks);
        } else {
            chunks.push(newChunk);
        }

        this.loadedChunks.set(messageId, chunks);
        return true;
    }

    getProgressiveText(messageId: string, maxChunks?: number): string {
        const chunks = this.loadedChunks.get(messageId) || [];
        const chunksToShow = maxChunks ? chunks.slice(0, maxChunks) : chunks;
        return chunksToShow.join('');
    }

    getTotalChunks(messageId: string): number {
        return this.loadedChunks.get(messageId)?.length || 0;
    }

    cleanup(messageId: string): void {
        this.loadedChunks.delete(messageId);
    }
}

// Advanced throttle with adaptive timing
export class AdaptiveThrottle {
    private lastExecution = 0;
    private averageInterval = 16; // Start with 16ms (60fps)
    private performanceHistory: number[] = [];
    private maxHistoryLength = 10;

    constructor(private minInterval = 4, private maxInterval = 50) {}

    execute<T extends any[]>(func: (...args: T) => void, ...args: T): void {
        const now = performance.now();
        const timeSinceLastExecution = now - this.lastExecution;

        // Adaptive timing based on performance
        const shouldExecute = timeSinceLastExecution >= this.getAdaptiveInterval();

        if (shouldExecute) {
            const startTime = performance.now();
            func(...args);
            const executionTime = performance.now() - startTime;

            // Track performance
            this.performanceHistory.push(executionTime);
            if (this.performanceHistory.length > this.maxHistoryLength) {
                this.performanceHistory.shift();
            }

            // Adjust interval based on execution time
            this.adjustInterval(executionTime);
            this.lastExecution = now;
        }
    }

    private getAdaptiveInterval(): number {
        return Math.max(this.minInterval, Math.min(this.maxInterval, this.averageInterval));
    }

    private adjustInterval(executionTime: number): void {
        const avgExecutionTime = this.performanceHistory.reduce((a, b) => a + b, 0) / this.performanceHistory.length;

        // If execution is taking too long, increase interval
        if (avgExecutionTime > 8) {
            this.averageInterval = Math.min(this.maxInterval, this.averageInterval * 1.2);
        } else if (avgExecutionTime < 2) {
            // If execution is fast, decrease interval for more responsive updates
            this.averageInterval = Math.max(this.minInterval, this.averageInterval * 0.9);
        }
    }

    reset(): void {
        this.lastExecution = 0;
        this.averageInterval = 16;
        this.performanceHistory = [];
    }
}

// Memory-efficient message buffer
export class MessageBuffer {
    private buffers: Map<string, {
        content: string;
        lastUpdate: number;
        isDirty: boolean;
        metadata: any;
    }> = new Map();

    private maxBufferSize = 50; // Maximum number of buffered messages
    private cleanupInterval = 30000; // 30 seconds

    constructor() {
        // Periodic cleanup of old buffers
        setInterval(() => this.cleanup(), this.cleanupInterval);
    }

    updateBuffer(messageId: string, content: string, metadata?: any): boolean {
        const existing = this.buffers.get(messageId);

        // Check if content actually changed
        if (existing && existing.content === content) {
            return false; // No change
        }

        this.buffers.set(messageId, {
            content,
            lastUpdate: Date.now(),
            isDirty: true,
            metadata: metadata || existing?.metadata,
        });

        // Manage buffer size
        if (this.buffers.size > this.maxBufferSize) {
            this.evictOldest();
        }

        return true; // Content changed
    }

    getBuffer(messageId: string): string | null {
        const buffer = this.buffers.get(messageId);
        return buffer ? buffer.content : null;
    }

    markClean(messageId: string): void {
        const buffer = this.buffers.get(messageId);
        if (buffer) {
            buffer.isDirty = false;
        }
    }

    isDirty(messageId: string): boolean {
        return this.buffers.get(messageId)?.isDirty || false;
    }

    private evictOldest(): void {
        let oldestId: string | null = null;
        let oldestTime = Infinity;

        for (const [id, buffer] of this.buffers) {
            if (buffer.lastUpdate < oldestTime) {
                oldestTime = buffer.lastUpdate;
                oldestId = id;
            }
        }

        if (oldestId) {
            this.buffers.delete(oldestId);
        }
    }

    private cleanup(): void {
        const now = Date.now();
        const maxAge = 300000; // 5 minutes

        for (const [id, buffer] of this.buffers) {
            if (now - buffer.lastUpdate > maxAge) {
                this.buffers.delete(id);
            }
        }
    }

    clear(): void {
        this.buffers.clear();
    }
}
