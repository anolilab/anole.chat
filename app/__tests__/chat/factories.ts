import type { ThreadMessageLike } from "@assistant-ui/react";
import { faker } from "@faker-js/faker";

import type { ConvexMessage } from "@/features/chat/providers/types";
import { generateId } from "@/features/chat/providers/types";

// Thread Message Factory
export const createMockThreadMessage = (overrides?: Partial<ThreadMessageLike>): ThreadMessageLike => {
    return {
        content: [{ text: faker.lorem.sentence(), type: "text" }],
        createdAt: new Date(),
        id: generateId(),
        role: "user",
        ...overrides,
    };
};

// Assistant Message Factory
export const createMockAssistantMessage = (overrides?: Partial<ThreadMessageLike>): ThreadMessageLike => {
    return {
        content: [{ text: faker.lorem.paragraph(), type: "text" }],
        createdAt: new Date(),
        id: generateId(),
        role: "assistant",
        ...overrides,
    };
};

// User Message Factory
export const createMockUserMessage = (overrides?: Partial<ThreadMessageLike>): ThreadMessageLike => {
    return {
        content: [{ text: faker.lorem.sentence(), type: "text" }],
        createdAt: new Date(),
        id: generateId(),
        role: "user",
        ...overrides,
    };
};

// System Message Factory
export const createMockSystemMessage = (overrides?: Partial<ThreadMessageLike>): ThreadMessageLike => {
    return {
        content: [{ text: faker.lorem.sentence(), type: "text" }],
        createdAt: new Date(),
        id: generateId(),
        role: "system",
        ...overrides,
    };
};

// Message with Image Content Factory
export const createMockImageMessage = (overrides?: Partial<ThreadMessageLike>): ThreadMessageLike => {
    return {
        content: [
            { text: faker.lorem.sentence(), type: "text" },
            { image: faker.image.dataUri(), type: "image" },
        ],
        createdAt: new Date(),
        id: generateId(),
        role: "user",
        ...overrides,
    };
};

// Message with Attachments Factory
export const createMockMessageWithAttachments = (overrides?: Partial<ThreadMessageLike>): ThreadMessageLike => {
    return {
        attachments: [
            {
                id: generateId(),
                metadata: {
                    fileId: generateId(),
                },
                name: faker.system.fileName(),
                size: faker.number.int({ max: 100_000, min: 1000 }),
                type: "file",
            },
        ],
        content: [{ text: faker.lorem.sentence(), type: "text" }],
        createdAt: new Date(),
        id: generateId(),
        role: "user",
        ...overrides,
    };
};

// Convex Message Factory
export const createMockConvexMessage = (overrides?: Partial<ConvexMessage>): ConvexMessage => {
    return {
        _creationTime: Date.now(),
        _id: generateId(),
        message: {
            content: faker.lorem.sentence(),
            role: "user",
        },
        tool: false,
        ...overrides,
    };
};

// Convex Assistant Message Factory
export const createMockConvexAssistantMessage = (overrides?: Partial<ConvexMessage>): ConvexMessage => {
    return {
        _creationTime: Date.now(),
        _id: generateId(),
        agentName: "test-agent",
        message: {
            content: faker.lorem.paragraph(),
            role: "assistant",
        },
        tool: false,
        ...overrides,
    };
};

// Convex Error Message Factory
export const createMockConvexErrorMessage = (overrides?: Partial<ConvexMessage>): ConvexMessage => {
    return {
        _creationTime: Date.now(),
        _id: generateId(),
        error: faker.lorem.sentence(),
        tool: false,
        ...overrides,
    };
};

// Thread Conversation Factory (multiple messages)
export const createMockConversation = (messageCount: number = 5): ThreadMessageLike[] => {
    const messages: ThreadMessageLike[] = [];

    for (let index = 0; index < messageCount; index++) {
        if (index % 2 === 0) {
            messages.push(createMockUserMessage());
        } else {
            messages.push(createMockAssistantMessage());
        }
    }

    return messages;
};

// Thread Metadata Factory
export const createMockThreadMetadata = (overrides?: any) => {
    return {
        createdAt: new Date(),
        lastActivity: new Date(),
        status: "active" as const,
        title: faker.lorem.words(3),
        ...overrides,
    };
};

// Stream Chunk Factory
export const createMockStreamChunk = (text: string, isComplete: boolean = false) => {
    return {
        isComplete,
        text,
        type: "text",
    };
};

// Stream Response Factory
export const createMockStreamResponse = (chunks: string[]) => {
    const encoder = new TextEncoder();

    return {
        body: new ReadableStream({
            start(controller) {
                chunks.forEach((chunk, index) => {
                    setTimeout(
                        () => {
                            controller.enqueue(
                                encoder.encode(
                                    `${JSON.stringify({
                                        text: chunk,
                                        type: "text",
                                    })}\n`,
                                ),
                            );

                            if (index === chunks.length - 1) {
                                controller.close();
                            }
                        },
                        10 * (index + 1),
                    );
                });
            },
        }),
        ok: true,
        status: 200,
    };
};

// Error Factory
export const createMockError = (message: string = "Test error", code?: string) => {
    const error = new Error(message);

    if (code) {
        (error as any).code = code;
    }

    return error;
};

// Network Error Factory
export const createMockNetworkError = () => {
    const error = new Error("Network request failed");

    (error as any).code = "NETWORK_ERROR";

    return error;
};

// Validation Error Factory
export const createMockValidationError = (field: string = "content") => {
    const error = new Error(`Validation failed for field: ${field}`);

    (error as any).code = "VALIDATION_ERROR";

    return error;
};

// Stream Error Factory
export const createMockStreamError = () => {
    const error = new Error("Stream interrupted");

    (error as any).code = "STREAM_ERROR";

    return error;
};
