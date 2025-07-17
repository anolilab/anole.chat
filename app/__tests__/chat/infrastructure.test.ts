import { describe, expect, it, vi } from "vitest";

import { convertConvexMessage, generateId, isValidThreadMessage } from "@/features/chat/providers/types";

import { createMockAssistantMessage, createMockConversation, createMockConvexMessage, createMockThreadMessage } from "./factories";
import { createMockThreadMessagesResponse, mockConvexClient, setupConvexMocks } from "./mocks/convex";
import { mockFetch, mockLogger, setupExternalMocks } from "./mocks/external-dependencies";

describe("Chat Testing Infrastructure", () => {
    describe("Test Factories", () => {
        it("should create valid thread messages", () => {
            const message = createMockThreadMessage();

            expect(message).toHaveProperty("id");
            expect(message).toHaveProperty("role");
            expect(message).toHaveProperty("content");
            expect(message).toHaveProperty("createdAt");
            expect(message.role).toBe("user");
            expect(Array.isArray(message.content)).toBe(true);
            expect(message.content.length).toBeGreaterThan(0);
        });

        it("should create assistant messages", () => {
            const message = createMockAssistantMessage();

            expect(message.role).toBe("assistant");
            expect(isValidThreadMessage(message)).toBe(true);
        });

        it("should create conversations", () => {
            const conversation = createMockConversation(4);

            expect(conversation).toHaveLength(4);
            expect(conversation[0]?.role).toBe("user");
            expect(conversation[1]?.role).toBe("assistant");
            expect(conversation[2]?.role).toBe("user");
            expect(conversation[3]?.role).toBe("assistant");
        });

        it("should create Convex messages", () => {
            const convexMessage = createMockConvexMessage();

            expect(convexMessage).toHaveProperty("_id");
            expect(convexMessage).toHaveProperty("_creationTime");
            expect(convexMessage).toHaveProperty("message");
            expect(convexMessage.message).toHaveProperty("role");
            expect(convexMessage.message).toHaveProperty("content");
        });
    });

    describe("Mock Setup", () => {
        it("should setup Convex mocks", () => {
            setupConvexMocks();

            expect(mockConvexClient.query).toBeDefined();
            expect(mockConvexClient.mutation).toBeDefined();
            expect(mockConvexClient.action).toBeDefined();
        });

        it("should setup external mocks", () => {
            setupExternalMocks();

            expect(mockLogger.debug).toBeDefined();
            expect(mockLogger.info).toBeDefined();
            expect(mockLogger.warn).toBeDefined();
            expect(mockLogger.error).toBeDefined();
            expect(mockFetch).toBeDefined();
        });

        it("should create mock responses", () => {
            const response = createMockThreadMessagesResponse([
                createMockConvexMessage(),
                createMockConvexMessage({ message: { content: "Test response", role: "assistant" } }),
            ]);

            expect(response.results).toHaveLength(2);
            expect(response.isLoading).toBe(false);
            expect(response.status).toBe("success");
        });
    });

    describe("Utility Functions", () => {
        it("should generate unique IDs", () => {
            const id1 = generateId();
            const id2 = generateId();

            expect(id1).not.toBe(id2);
            expect(typeof id1).toBe("string");
            expect(id1.length).toBeGreaterThan(0);
        });

        it("should validate thread messages", () => {
            const validMessage = createMockThreadMessage();
            const invalidMessage = { content: [], id: "", role: "invalid" };

            expect(isValidThreadMessage(validMessage)).toBe(true);
            expect(isValidThreadMessage(invalidMessage)).toBe(false);
        });

        it("should convert Convex messages", () => {
            const convexMessage = createMockConvexMessage({
                message: {
                    content: "Test message",
                    role: "user",
                },
            });

            const converted = convertConvexMessage(convexMessage);

            expect(isValidThreadMessage(converted)).toBe(true);
            expect(converted.role).toBe("user");
            expect(converted.content[0]).toEqual({
                text: "Test message",
                type: "text",
            });
        });
    });
});
