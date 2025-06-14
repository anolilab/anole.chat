import { useRuntime, useMessage, getExternalStoreMessages } from "@assistant-ui/react";
import type { ConvexMessage } from "../convex-external-runtime-provider";

/**
 * Hook to access the original Convex messages from the runtime
 * This demonstrates the pattern from the ExternalStoreRuntime documentation
 */
export const useConvexMessages = () => {
    const runtime = useRuntime();

    // Get all original Convex messages
    const originalMessages = getExternalStoreMessages<ConvexMessage>(runtime);

    return originalMessages;
};

/**
 * Hook to access external store messages for a specific message
 * Use within message components to access original message data
 */
export const useConvexMessageData = () => {
    const originalMessages = useMessage((m) => getExternalStoreMessages<ConvexMessage>(m));

    return originalMessages;
};

/**
 * Hook to get runtime statistics and state
 */
export const useConvexRuntimeState = () => {
    const runtime = useRuntime();

    return {
        isRunning: runtime.isRunning,
        messages: runtime.messages,
        capabilities: runtime.capabilities,
        // Add any additional runtime state you need
    };
};
