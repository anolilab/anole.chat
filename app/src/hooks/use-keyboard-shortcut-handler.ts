import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import type { KeyboardShortcutsConfig } from "@/components/keyboard-shortcuts-manager";

export function useKeyboardShortcutHandler() {
  const navigate = useNavigate();
  
  return useCallback((action: keyof KeyboardShortcutsConfig, event: KeyboardEvent) => {
    switch (action) {
      case "newChat":
        navigate({ to: "/chat/new" });
        break;
      case "search":
        case "search": {
          // Trigger search modal or focus search input
          const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]') || 
                              document.querySelector<HTMLInputElement>('[data-testid="search-input"]');
          if (searchInput) {
            searchInput.focus();
          }
        }
        break;
      case "help":
        // Open help modal or navigate to help page
        const helpButton = document.querySelector<HTMLButtonElement>('[data-testid="help-button"]');
        if (helpButton) {
          helpButton.click();
        } else {
          // Fallback to help page if no help button found
          navigate({ to: "/help" });
        }
        break;
      case "escape":
        {
          // Close modals, blur inputs, etc.
          const activeElement = document.activeElement as HTMLElement;
          if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
            activeElement.blur();
          } else {
            // Dispatch escape event to close any open dialogs
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
          }
        }
        break;
      // sidebarLeft and sidebarRight are handled by ProgrammableSidebarProvider
      case "sidebarLeft":
      case "sidebarRight":
        // These are handled by the sidebar provider, no action needed here
        break;
      default:
        console.log("Unhandled keyboard shortcut:", action, event);
    }
  }, [navigate]);
}