class AdaptiveThrottle {
    private lastExecution = 0;

    private averageInterval = 16; // Start with 16ms (60fps)

    private performanceHistory: number[] = [];

    private maxHistoryLength = 10;

    constructor(
        private minInterval = 4,
        private maxInterval = 50,
    ) {}

    execute<T extends any[]>(function_: (...arguments_: T) => void, ...arguments_: T): void {
        const now = performance.now();
        const timeSinceLastExecution = now - this.lastExecution;

        // Adaptive timing based on performance
        const shouldExecute = timeSinceLastExecution >= this.getAdaptiveInterval();

        if (shouldExecute) {
            const startTime = performance.now();

            function_(...arguments_);
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

export default AdaptiveThrottle;
