# TODO List

## ✅ Completed

### Thread Management Optimizations

- [x] **Memoize `getBranchTree()` function** - ✅ Completed: Added `useMemo` to avoid rebuilding tree on each call

    - Also memoized related functions: `getChildBranches`, `getParentThread`, `getThreadPath`, `getBranchSiblings`
    - Dependencies properly tracked: `threadMetadata`, `allThreads?.page`
    - Performance improvement: Tree calculations now only run when underlying data changes

- [x] **Implement virtual scrolling for thread list** - ✅ Completed: Added TanStack Virtual for lists >100 threads

    - Uses `@tanstack/react-virtual` for efficient rendering of large thread lists
    - Automatically switches to virtual scrolling when >100 threads are present
    - Flattens hierarchical structure for virtualization while preserving expand/collapse state
    - Estimated item height of 44px with 10 item overscan for smooth scrolling
    - Falls back to regular rendering for smaller lists to maintain full hierarchy visualization

- [x] **Thread Pin Functionality** - ✅ Completed: Added pin/unpin functionality for important conversations

    - Added `pinnedThreads` table to schema with proper indexing
    - Implemented `pinThread`, `unpinThread`, `getPinnedThreads`, and `isThreadPinned` mutations/queries
    - Pin button in thread list with Pin/PinOff icons and hover states
    - Visual pin indicator next to thread title for pinned threads
    - Pinned threads automatically sorted to top of thread list
    - Proper error handling and user feedback for pin operations

- [x] **Drag and Drop Thread Reordering** - ✅ Completed: Added drag and drop functionality to reorder threads
    - Added `threadOrder` table to schema for custom thread ordering
    - Implemented `updateThreadOrder` and `getThreadOrders` mutations/queries
    - Integrated `@dnd-kit/core` and `@dnd-kit/sortable` for drag and drop functionality
    - Drag handle (GripVertical icon) appears on hover for each thread
    - Smooth drag animations with visual feedback (opacity change during drag)
    - Custom sorting: pinned threads first, then by custom order, then by creation time
    - Works with both virtual scrolling and regular rendering modes
    - Keyboard accessibility support for drag and drop operations

- [x] **Keyboard Shortcuts for Common Actions** - ✅ Completed: Added comprehensive keyboard navigation and shortcuts
  - **Thread Actions**: `Ctrl+N` (new), `Ctrl+D` (delete), `Ctrl+P` (pin/unpin), `Ctrl+B` (branch)
  - **Navigation**: `↑↓` arrows to navigate threads, `Enter` to open selected thread
  - **Help System**: `?` to show/hide keyboard shortcuts help overlay
  - **Escape Handling**: `Esc` to cancel navigation or close help
  - **Smart Context**: Shortcuts disabled when typing in inputs/textareas
  - **Visual Feedback**: Keyboard-selected threads highlighted with ring border
  - **Mouse Integration**: Mouse hover automatically cancels keyboard navigation
  - **Accessibility**: Full keyboard navigation support for all thread operations
  - **Enhanced UI**: Professional keyboard shortcuts component with OS-specific symbols (⌘ on Mac, Ctrl on Windows)
  - **Tooltips**: Hover tooltips for key symbols with full key names

## High Priority

### Model Display in Messages

- **Issue**: Currently, Convex agent and Assistant UI don't support accessing original message metadata (like `agentName`) in the UI components
- **Goal**: Display which AI model generated each message (gpt-4o-mini, claude-3-5-sonnet, gemini-1.5-flash, etc.)
- **Current Status**:
    - The integration between `@convex-dev/agent` and `@assistant-ui/react` doesn't expose the original Convex message data
    - Attempted `useConvexMessageData` hook approach was unsuccessful and removed
- **Potential Solutions**:
    1. Wait for Assistant UI to improve external store message access
    2. Modify the message conversion in `ConvexExternalRuntimeProvider` to include model info in metadata
    3. Create a custom message component that tracks model info separately
    4. Contribute to Assistant UI to improve external store data access

## Medium Priority

### Thread Management Optimizations

- [ ] Add progressive message loading instead of loading 50 messages at once
- [ ] Add thread search functionality
- [ ] Implement thread archiving UI

### UI/UX Improvements

- [ ] Add loading states for thread operations
- [ ] Improve error handling and user feedback
- [ ] Add keyboard shortcuts for common actions
- [ ] Fix per-node expansion in branch tree (currently all nodes expand together)

## Low Priority

### Features

- [ ] Export conversation functionality
- [ ] Message search within threads
- [ ] Custom model configuration UI
- [ ] Message reactions/feedback system

---

_Last updated: Current session_
