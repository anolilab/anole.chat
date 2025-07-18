import React from "react";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { isValidThreadMessage } from "@/features/chat/providers/types";

import { createMockConversation, createMockThreadMessage } from "./factories";
import { renderWithProviders } from "./test-utils";

// Simple test component
const TestComponent = () => (
    <div data-testid="test-component">
        <h1>Chat Test Component</h1>
        <p>This is a test component for chat functionality</p>
    </div>
);

describe("Chat Testing Example", () => {
    describe("Basic Rendering", () => {
        it("should render test component", () => {
            const result = render(<TestComponent />);

            expect(result.getByTestId("test-component")).toBeDefined();
            expect(result.getByText("Chat Test Component")).toBeDefined();
        });

        it("should render with providers", () => {
            const result = renderWithProviders(TestComponent);

            expect(result.getByTestId("test-component")).toBeDefined();
        });
    });

    describe("Factory Usage", () => {
        it("should create and validate messages", () => {
            const message = createMockThreadMessage({
                content: [{ text: "Hello, world!", type: "text" }],
            });

            expect(isValidThreadMessage(message)).toBe(true);
            expect(message.content[0]).toEqual({
                text: "Hello, world!",
                type: "text",
            });
        });

        it("should create conversations", () => {
            const conversation = createMockConversation(3);

            expect(conversation).toHaveLength(3);
            expect(conversation.every((message) => isValidThreadMessage(message))).toBe(true);
        });
    });

    describe("Async Operations", () => {
        it("should handle async operations", async () => {
            const promise = new Promise((resolve) => setTimeout(() => resolve("test result"), 10));

            const result = await promise;

            expect(result).toBe("test result");
        });
    });
});
