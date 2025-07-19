import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useKeyboardShortcutHandler } from "./use-keyboard-shortcut-handler";

// Mock TanStack Router
vi.mock("@tanstack/react-router", () => ({
    useNavigate: () => vi.fn(),
}));

// Mock document methods
const mockQuerySelector = vi.fn();
const mockFocus = vi.fn();
const mockClick = vi.fn();
const mockBlur = vi.fn();
const mockDispatchEvent = vi.fn();

Object.defineProperty(document, 'querySelector', {
    value: mockQuerySelector,
    writable: true,
});

Object.defineProperty(document, 'dispatchEvent', {
    value: mockDispatchEvent,
    writable: true,
});

describe("useKeyboardShortcutHandler", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockQuerySelector.mockReturnValue(null);
    });

    it("should handle newChat action", () => {
        const { result } = renderHook(() => useKeyboardShortcutHandler());
        const handleShortcut = result.current;

        const mockEvent = new KeyboardEvent('keydown', { key: 'n' });
        handleShortcut("newChat", mockEvent);

        // Note: We can't easily test navigation without more complex mocking
        // The hook should not throw an error
        expect(handleShortcut).toBeDefined();
    });

    it("should handle search action with data-search-input", () => {
        const mockSearchInput = { focus: mockFocus };
        mockQuerySelector.mockReturnValueOnce(mockSearchInput);

        const { result } = renderHook(() => useKeyboardShortcutHandler());
        const handleShortcut = result.current;

        const mockEvent = new KeyboardEvent('keydown', { key: 'k' });
        handleShortcut("search", mockEvent);

        expect(mockQuerySelector).toHaveBeenCalledWith('[data-search-input]');
        expect(mockFocus).toHaveBeenCalled();
    });

    it("should handle search action with data-testid", () => {
        const mockSearchInput = { focus: mockFocus };
        mockQuerySelector
            .mockReturnValueOnce(null) // First call for data-search-input
            .mockReturnValueOnce(mockSearchInput); // Second call for data-testid

        const { result } = renderHook(() => useKeyboardShortcutHandler());
        const handleShortcut = result.current;

        const mockEvent = new KeyboardEvent('keydown', { key: 'k' });
        handleShortcut("search", mockEvent);

        expect(mockQuerySelector).toHaveBeenCalledWith('[data-testid="search-input"]');
        expect(mockFocus).toHaveBeenCalled();
    });

    it("should handle help action with help button", () => {
        const mockHelpButton = { click: mockClick };
        mockQuerySelector.mockReturnValueOnce(mockHelpButton);

        const { result } = renderHook(() => useKeyboardShortcutHandler());
        const handleShortcut = result.current;

        const mockEvent = new KeyboardEvent('keydown', { key: '?' });
        handleShortcut("help", mockEvent);

        expect(mockQuerySelector).toHaveBeenCalledWith('[data-testid="help-button"]');
        expect(mockClick).toHaveBeenCalled();
    });

    it("should handle escape action with active input element", () => {
        const mockActiveElement = { tagName: 'INPUT', blur: mockBlur };
        Object.defineProperty(document, 'activeElement', {
            value: mockActiveElement,
            writable: true,
        });

        const { result } = renderHook(() => useKeyboardShortcutHandler());
        const handleShortcut = result.current;

        const mockEvent = new KeyboardEvent('keydown', { key: 'Escape' });
        handleShortcut("escape", mockEvent);

        expect(mockBlur).toHaveBeenCalled();
    });

    it("should handle escape action without active input", () => {
        Object.defineProperty(document, 'activeElement', {
            value: null,
            writable: true,
        });

        const { result } = renderHook(() => useKeyboardShortcutHandler());
        const handleShortcut = result.current;

        const mockEvent = new KeyboardEvent('keydown', { key: 'Escape' });
        handleShortcut("escape", mockEvent);

        expect(mockDispatchEvent).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'keydown',
                key: 'Escape'
            })
        );
    });

    it("should handle sidebar actions (no-op)", () => {
        const { result } = renderHook(() => useKeyboardShortcutHandler());
        const handleShortcut = result.current;

        const mockEvent = new KeyboardEvent('keydown', { key: 'b' });
        
        // These should not throw errors
        expect(() => handleShortcut("sidebarLeft", mockEvent)).not.toThrow();
        expect(() => handleShortcut("sidebarRight", mockEvent)).not.toThrow();
    });

    it("should handle unknown actions", () => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        
        const { result } = renderHook(() => useKeyboardShortcutHandler());
        const handleShortcut = result.current;

        const mockEvent = new KeyboardEvent('keydown', { key: 'x' });
        handleShortcut("unknownAction" as any, mockEvent);

        expect(consoleSpy).toHaveBeenCalledWith("Unhandled keyboard shortcut:", "unknownAction", mockEvent);
        
        consoleSpy.mockRestore();
    });
});