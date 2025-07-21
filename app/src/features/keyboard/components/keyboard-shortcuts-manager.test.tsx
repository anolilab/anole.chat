import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { KeyboardShortcutsManager, useKeyboardShortcuts } from "./keyboard-shortcuts-manager";

// Mock Convex
vi.mock("convex/react", () => {
    return {
        useConvexQuery: vi.fn(() => {
            return { keyboardShortcuts: {} };
        }),
        useMutation: vi.fn(() => vi.fn()),
    };
});

// Test component to access context
const TestComponent = () => {
    const { shortcuts } = useKeyboardShortcuts();

    return (
        <div>
            <div data-testid="sidebar-left">{shortcuts.sidebarLeft}</div>
            <div data-testid="sidebar-right">{shortcuts.sidebarRight}</div>
            <div data-testid="new-chat">{shortcuts.newChat}</div>
        </div>
    );
};

describe("KeyboardShortcutsManager", () => {
    it("should provide default shortcuts", () => {
        render(
            <KeyboardShortcutsManager>
                <TestComponent />
            </KeyboardShortcutsManager>,
        );

        expect(screen.getByTestId("sidebar-left")).toHaveTextContent("b");
        expect(screen.getByTestId("sidebar-right")).toHaveTextContent("l");
        expect(screen.getByTestId("new-chat")).toHaveTextContent("n");
    });

    it("should handle keyboard events", () => {
        const onShortcut = vi.fn();

        render(
            <KeyboardShortcutsManager onShortcut={onShortcut}>
                <div>Test</div>
            </KeyboardShortcutsManager>,
        );

        // Simulate pressing 'b' key
        fireEvent.keyDown(document, { key: "b" });

        expect(onShortcut).toHaveBeenCalledWith("sidebarLeft", expect.any(Object));
    });

    it("should not handle shortcuts when typing in input", () => {
        const onShortcut = vi.fn();

        render(
            <KeyboardShortcutsManager onShortcut={onShortcut}>
                <input data-testid="input" />
            </KeyboardShortcutsManager>,
        );

        const input = screen.getByTestId("input");

        input.focus();

        // Simulate pressing 'b' key while input is focused
        fireEvent.keyDown(input, { key: "b" });

        expect(onShortcut).not.toHaveBeenCalled();
    });

    it("should handle modifier key combinations", () => {
        const onShortcut = vi.fn();

        render(
            <KeyboardShortcutsManager onShortcut={onShortcut} shortcuts={{ search: "ctrl+k" }}>
                <div>Test</div>
            </KeyboardShortcutsManager>,
        );

        // Simulate Ctrl+K
        fireEvent.keyDown(document, { ctrlKey: true, key: "k" });

        expect(onShortcut).toHaveBeenCalledWith("search", expect.any(Object));
    });

    it("should throw error when hook is used outside provider", () => {
        const TestComponentWithError = () => {
            try {
                useKeyboardShortcuts();

                return <div>Should not render</div>;
            } catch (error) {
                return <div>{error.message}</div>;
            }
        };

        render(<TestComponentWithError />);

        expect(screen.getByText("useKeyboardShortcuts must be used within KeyboardShortcutsManager")).toBeInTheDocument();
    });
});
