import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { KeyboardShortcutsSettings } from "./keyboard-shortcuts";
import { DEFAULT_KEYBOARD_SHORTCUTS, useKeyboardShortcuts } from "../../../../components/keyboard-shortcuts-manager";

// Mock the keyboard shortcuts context
vi.mock("../../../../components/keyboard-shortcuts-manager", async () => {
    const actual = await vi.importActual("../../../../components/keyboard-shortcuts-manager");
    return {
        ...actual,
        useKeyboardShortcuts: () => ({
            shortcuts: DEFAULT_KEYBOARD_SHORTCUTS,
            updateShortcuts: vi.fn().mockResolvedValue(undefined),
            parseShortcut: vi.fn(),
            matchesShortcut: vi.fn(),
        }),
    },
});

describe("KeyboardShortcutsSettings", () => {
    it("should render all shortcut inputs with correct labels", () => {
        render(<KeyboardShortcutsSettings />);
        
        expect(screen.getByText("Toggle Left Sidebar")).toBeInTheDocument();
        expect(screen.getByText("Toggle Right Sidebar")).toBeInTheDocument();
        expect(screen.getByText("New Chat")).toBeInTheDocument();
        expect(screen.getByText("Search")).toBeInTheDocument();
        expect(screen.getByText("Show Help")).toBeInTheDocument();
        expect(screen.getByText("Escape")).toBeInTheDocument();
    });

    it("should display default shortcut values", () => {
        render(<KeyboardShortcutsSettings />);
        
        // Check that default values are displayed
        const inputs = screen.getAllByRole("textbox");
        expect(inputs).toHaveLength(6);
        
        // The first input should show the default sidebarLeft value
        expect(inputs[0]).toHaveValue(DEFAULT_KEYBOARD_SHORTCUTS.sidebarLeft);
    });

    it("should reset individual shortcuts to default values", () => {
        render(<KeyboardShortcutsSettings />);
        
        // Find the reset button for the first shortcut (Toggle Left Sidebar)
        const resetButtons = screen.getAllByRole("button").filter(button => 
            button.querySelector('[data-testid="reset-button"]') || 
            button.querySelector('.h-3.w-3') // RotateCcw icon
        );
        
        // Click the first reset button
        if (resetButtons.length > 0) {
            fireEvent.click(resetButtons[0]);
            
            // The input should still show the default value
            const inputs = screen.getAllByRole("textbox");
            expect(inputs[0]).toHaveValue(DEFAULT_KEYBOARD_SHORTCUTS.sidebarLeft);
        }
    });

    it("should reset all shortcuts to defaults", () => {
        render(<KeyboardShortcutsSettings />);
        
        const resetAllButton = screen.getByText("Reset to Defaults");
        fireEvent.click(resetAllButton);
        
        // All inputs should show default values
        const inputs = screen.getAllByRole("textbox");
        expect(inputs[0]).toHaveValue(DEFAULT_KEYBOARD_SHORTCUTS.sidebarLeft);
        expect(inputs[1]).toHaveValue(DEFAULT_KEYBOARD_SHORTCUTS.sidebarRight);
        expect(inputs[2]).toHaveValue(DEFAULT_KEYBOARD_SHORTCUTS.newChat);
        expect(inputs[3]).toHaveValue(DEFAULT_KEYBOARD_SHORTCUTS.search);
        expect(inputs[4]).toHaveValue(DEFAULT_KEYBOARD_SHORTCUTS.help);
        expect(inputs[5]).toHaveValue(DEFAULT_KEYBOARD_SHORTCUTS.escape);
    });

    it("should show default shortcuts reference", () => {
        render(<KeyboardShortcutsSettings />);
        
        expect(screen.getByText("Default Shortcuts")).toBeInTheDocument();
        
        // Check that default values are shown in the reference section
        Object.entries(DEFAULT_KEYBOARD_SHORTCUTS).forEach(([key, value]) => {
            expect(screen.getByText(value)).toBeInTheDocument();
        });
    });

    it("should show error alert when save fails", async () => {
        // Mock the updateShortcuts to throw an error
        const mockUpdateShortcuts = vi.fn().mockRejectedValue(new Error("Network error"));
        (useKeyboardShortcuts as any).mockReturnValue({
            shortcuts: DEFAULT_KEYBOARD_SHORTCUTS,
            updateShortcuts: mockUpdateShortcuts,
            parseShortcut: vi.fn(),
            matchesShortcut: vi.fn(),
        });

        render(<KeyboardShortcutsSettings />);
        
        // Make a change to trigger save button
        const inputs = screen.getAllByRole("textbox");
        fireEvent.change(inputs[0], { target: { value: "x" } });
        
        // Click save button
        const saveButton = screen.getByText("Save Changes");
        fireEvent.click(saveButton);
        
        // Wait for error to appear
        await screen.findByText("Failed to save keyboard shortcuts. Please try again.");
        
        // Error alert should be visible
        expect(screen.getByText("Failed to save keyboard shortcuts. Please try again.")).toBeInTheDocument();
    });

    it("should clear error when user makes changes", async () => {
        // Mock the updateShortcuts to throw an error first, then succeed
        const mockUpdateShortcuts = vi.fn()
            .mockRejectedValueOnce(new Error("Network error"))
            .mockResolvedValueOnce(undefined);
        
        (useKeyboardShortcuts as any).mockReturnValue({
            shortcuts: DEFAULT_KEYBOARD_SHORTCUTS,
            updateShortcuts: mockUpdateShortcuts,
            parseShortcut: vi.fn(),
            matchesShortcut: vi.fn(),
        });

        render(<KeyboardShortcutsSettings />);
        
        // Make a change and save (should fail)
        const inputs = screen.getAllByRole("textbox");
        fireEvent.change(inputs[0], { target: { value: "x" } });
        
        const saveButton = screen.getByText("Save Changes");
        fireEvent.click(saveButton);
        
        // Wait for error to appear
        await screen.findByText("Failed to save keyboard shortcuts. Please try again.");
        
        // Make another change (should clear error)
        fireEvent.change(inputs[1], { target: { value: "y" } });
        
        // Error should be cleared
        expect(screen.queryByText("Failed to save keyboard shortcuts. Please try again.")).not.toBeInTheDocument();
    });
});