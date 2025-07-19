# Programmable Keyboard Shortcuts

This document describes the new programmable keyboard shortcuts feature that allows users to customize their keyboard shortcuts for a personalized experience.

## Overview

The keyboard shortcuts system has been refactored to be fully programmable, allowing users to:
- Customize shortcuts for common actions
- Save preferences to their user settings
- Reset to default shortcuts
- Use complex key combinations (Ctrl+K, Cmd+Shift+N, etc.)

## Architecture

### Components

1. **KeyboardShortcutsManager** (`app/src/components/keyboard-shortcuts-manager.tsx`)
   - Main component that handles keyboard event listening
   - Manages user settings integration
   - Provides context for child components

2. **ProgrammableSidebarProvider** (`app/src/components/programmable-sidebar-provider.tsx`)
   - Wraps the existing SidebarProvider
   - Integrates with programmable shortcuts for sidebar toggling

3. **KeyboardShortcutsSettings** (`app/src/routes/dashboard/settings/keyboard-shortcuts/keyboard-shortcuts.tsx`)
   - Settings page for customizing shortcuts
   - Provides visual interface for shortcut configuration

### Database Schema

The `userSettings` table has been extended with a `keyboardShortcuts` field:

```typescript
keyboardShortcuts: v.optional(
    v.object({
        sidebarLeft: v.optional(v.string()),
        sidebarRight: v.optional(v.string()),
        newChat: v.optional(v.string()),
        search: v.optional(v.string()),
        help: v.optional(v.string()),
        escape: v.optional(v.string()),
    }),
),
```

## Default Shortcuts

| Action | Default Shortcut | Description |
|--------|------------------|-------------|
| Toggle Left Sidebar | `b` | Open or close the left sidebar panel |
| Toggle Right Sidebar | `l` | Open or close the right sidebar panel |
| New Chat | `n` | Start a new conversation |
| Search | `k` | Open the search interface |
| Show Help | `?` | Display keyboard shortcuts help |
| Escape | `Escape` | Close dialogs or cancel actions |

## Usage

### For Users

1. Navigate to **Dashboard > Settings > Keyboard Shortcuts**
2. Click on any input field to start recording a shortcut
3. Press the desired key combination
4. Click "Save Changes" to persist your preferences
5. Use "Reset to Defaults" to restore original shortcuts

### For Developers

#### Basic Usage

```tsx
import { KeyboardShortcutsManager } from "@/components/keyboard-shortcuts-manager";

function App() {
    return (
        <KeyboardShortcutsManager
            onShortcut={(action, event) => {
                console.log("Shortcut triggered:", action);
            }}
        >
            {/* Your app content */}
        </KeyboardShortcutsManager>
    );
}
```

#### Using the Context

```tsx
import { useKeyboardShortcuts } from "@/components/keyboard-shortcuts-manager";

function MyComponent() {
    const { shortcuts, updateShortcuts } = useKeyboardShortcuts();
    
    const handleCustomAction = () => {
        // Access current shortcuts
        console.log("Current sidebar shortcut:", shortcuts.sidebarLeft);
        
        // Update shortcuts
        updateShortcuts({ sidebarLeft: "Ctrl+B" });
    };
    
    return <div>...</div>;
}
```

#### With Sidebars

```tsx
import { ProgrammableSidebarProvider } from "@/components/programmable-sidebar-provider";

function Layout() {
    return (
        <KeyboardShortcutsManager>
            <ProgrammableSidebarProvider
                sidebarNames={["left", "right"]}
                defaultOpen={["left"]}
            >
                {/* Sidebar content */}
            </ProgrammableSidebarProvider>
        </KeyboardShortcutsManager>
    );
}
```

## Implementation Details

### Shortcut Parsing

The system supports complex key combinations:
- **Modifiers**: Ctrl, Cmd, Shift, Alt
- **Keys**: Any standard keyboard key
- **Format**: `Modifier+Modifier+Key` (e.g., `Ctrl+Shift+N`)

### Event Handling

- Shortcuts are ignored when typing in input fields
- Prevents default browser behavior for shortcut keys
- Supports both single keys and key combinations

### Settings Persistence

- Shortcuts are saved to user settings in Convex
- Changes are immediately available across the app
- Fallback to defaults if no custom shortcuts are set

## Migration from Old System

The old hardcoded keyboard shortcuts have been replaced:

**Before:**
```tsx
<SidebarProvider keyboardShortcuts={{ left: "b", right: "l" }}>
```

**After:**
```tsx
<KeyboardShortcutsManager>
    <ProgrammableSidebarProvider sidebarNames={["left", "right"]}>
```

## Testing

Run the test suite to verify functionality:

```bash
npm test keyboard-shortcuts-manager.test.tsx
```

## Future Enhancements

Potential improvements for the keyboard shortcuts system:

1. **More Actions**: Add shortcuts for additional features
2. **Context-Aware Shortcuts**: Different shortcuts based on current view
3. **Import/Export**: Allow users to share shortcut configurations
4. **Conflict Detection**: Warn about conflicting shortcuts
5. **Accessibility**: Better support for screen readers and assistive technologies