import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";

import { keyboardShortcutsHelpers, type KeyboardShortcuts } from "../collections/keyboard-shortcuts-collection";

const useKeyboardShortcutHandler = () => {
    const navigate = useNavigate();

    return useCallback(
        (action: keyof KeyboardShortcuts, event: KeyboardEvent) => {
            switch (action) {
                case "escape": {
                    {
                        // Close modals, blur inputs, etc.
                        const activeElement = document.activeElement as HTMLElement;

                        if (activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA")) {
                            activeElement.blur();
                        } else {
                            // Dispatch escape event to close any open dialogs
                            document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
                        }
                    }
                    break;
                }
                case "help": {
                    {
                        // Open help modal or navigate to help page
                        const helpButton = document.querySelector<HTMLButtonElement>("[data-testid=\"help-button\"]");

                        if (helpButton) {
                            helpButton.click();
                        } else {
                            // Fallback to help page if no help button found
                            navigate({ to: "/help" });
                        }
                    }
                    break;
                }
                case "newChat": {
                    navigate({ to: "/chat/new" });
                    break;
                }
                case "search": 
                case "focusSearch": {
                    {
                        // Trigger search modal or focus search input
                        const searchInput
                            = document.querySelector<HTMLInputElement>("[data-search-input]")
                                || document.querySelector<HTMLInputElement>("[data-testid=\"search-input\"]");

                        if (searchInput) {
                            searchInput.focus();
                        }
                    }
                    break;
                }
                // Navigation shortcuts
                case "nextItem": {
                    // Navigate to next item (implementation depends on current context)
                    const focusedElement = document.activeElement;
                    const items = Array.from(document.querySelectorAll('[tabindex="0"], button, input, a'));
                    const currentIndex = items.indexOf(focusedElement as Element);
                    const nextIndex = (currentIndex + 1) % items.length;
                    (items[nextIndex] as HTMLElement)?.focus();
                    break;
                }
                case "prevItem": {
                    // Navigate to previous item
                    const focusedElement = document.activeElement;
                    const items = Array.from(document.querySelectorAll('[tabindex="0"], button, input, a'));
                    const currentIndex = items.indexOf(focusedElement as Element);
                    const prevIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
                    (items[prevIndex] as HTMLElement)?.focus();
                    break;
                }
                case "firstItem": {
                    // Navigate to first item
                    const items = Array.from(document.querySelectorAll('[tabindex="0"], button, input, a'));
                    (items[0] as HTMLElement)?.focus();
                    break;
                }
                case "lastItem": {
                    // Navigate to last item
                    const items = Array.from(document.querySelectorAll('[tabindex="0"], button, input, a'));
                    (items[items.length - 1] as HTMLElement)?.focus();
                    break;
                }
                // sidebarLeft and sidebarRight are handled by TanStackSidebarProvider
                case "sidebarLeft":
                case "sidebarRight": {
                    // These are handled by the TanStack sidebar provider, no action needed here
                    break;
                }
                default: {
                    console.log("Unhandled keyboard shortcut:", action, event);
                }
            }
        },
        [navigate],
    );
};

export default useKeyboardShortcutHandler;
