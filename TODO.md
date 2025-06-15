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

- [x] **Loading States for Thread Operations** - ✅ Completed: Added comprehensive loading indicators for better user feedback

    - **Thread Operation Loading States**: Pin/unpin, delete, branch creation, and reordering operations show loading spinners
    - **Search Loading Indicators**: Loading states for both thread search and message search operations
    - **Main Thread List Loading**: Loading indicator when initially fetching threads
    - **Visual Feedback**: Disabled buttons and opacity changes during operations to prevent multiple clicks
    - **Enhanced UX**: Loading spinners replace action icons during operations with descriptive tooltips
    - **State Management**: Comprehensive loading state tracking using Sets for multiple concurrent operations
    - **Error Handling**: Proper cleanup of loading states in finally blocks to ensure UI consistency
    - **Search UI**: Loading indicator in search input field and dedicated loading state for search results

- [x] **AI-Powered Prompt Improvement** - ✅ Completed: Added intelligent prompt enhancement feature with Sparkles icon

    - **Smart Prompt Enhancement**: AI-powered prompt improvement using GPT-4o-mini with expert prompt engineering system prompt
    - **Convex HTTP Integration**: Implemented HTTP action endpoint at `/convex-http/chat/improve-prompt` for prompt processing
    - **Seamless UI Integration**: Added Sparkles icon button in message composer with hover tooltips and loading states
    - **Real-time Feedback**: Visual loading indicators with pulsing animation during prompt improvement
    - **Error Handling**: Graceful fallback to original prompt if improvement fails
    - **Session Security**: Proper authentication and session validation for all improvement requests
    - **Temporary Thread Management**: Automatic cleanup of temporary threads used for prompt processing
    - **Expert System Prompt**: Comprehensive guidelines for making prompts more specific, clear, and effective
    - **One-Click Enhancement**: Simple click to instantly improve any prompt before sending

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

### Message Feedback System

- **Issue**: The current system for message feedback requires one database query per message to get its feedback state, which is inefficient.
- **Goal**: Load message feedback data along with the messages themselves in a single query.
- **Current Status**:
    - An attempt to augment the `listMessages` function in `convex/chat.ts` with feedback data was reverted. The underlying `@convex-dev/agent` package's `listMessages` function doesn't easily allow for augmenting the returned message objects.
- **Potential Solutions**:
    1.  **Fork `@convex-dev/agent`**: This would give us full control to modify the `listMessages` function to include additional data, like feedback, from other tables. This is the most likely path forward.
    2.  **Post-process messages on the client**: Fetch feedback for all visible messages in a single batch query after the messages are loaded. This is less efficient than doing it on the backend but avoids forking the package.
    3.  **Contribute to `@convex-dev/agent`**: Propose and contribute a change to the package that allows for augmenting message data, which would benefit the wider community.

## Medium Priority

### Thread Management Optimizations

- [ ] Add progressive message loading instead of loading 50 messages at once
- [x] Add thread search functionality
    - **Split Search Implementation**: Implemented two distinct search types for better user experience
    - **Thread Search Features**:
        - Search through thread titles and summaries
        - Fast client-side filtering for thread metadata
        - Keyboard shortcut: Ctrl/Cmd+F to toggle search interface
        - Toggle between "Threads" and "Messages" search modes
    - **Message Search Features**:
        - Full-text search across all message content using Convex's `textSearch` function
        - Search results ranked by relevance (number of matching messages per thread)
        - Visual indicators showing match count for threads with search results
        - Server-side search for optimal performance with large datasets
    - **Enhanced UI**:
        - Search type toggle buttons (Threads/Messages)
        - Context-aware placeholders ("Search thread titles..." vs "Search message content...")
        - Different empty state messages for each search type
        - Maintains all existing functionality (pinning, drag & drop, keyboard shortcuts)
    - **Technical Implementation**:
        - Added `searchThreads` query for thread-level search (title/summary filtering)
        - Added `searchMessages` query using `components.agent.messages.textSearch` for content search
        - Updated thread list to handle both search types with appropriate result processing
        - Preserved hierarchical thread relationships in both search modes
- [ ] Implement thread archiving UI

### UI/UX Improvements

- [ ] Improve error handling and user feedback
- [ ] Fix per-node expansion in branch tree (currently all nodes expand together)

## Low Priority

### Features

- [ ] Export conversation functionality
- [ ] Custom model configuration UI
- [ ] Message reactions/feedback system

## Enhanced Error Handling & Rate Limiting Implementation

### Phase 1: Error System Foundation

- [x] Create `src/lib/errors/` directory structure
- [x] Implement custom error classes extending base Error
- [x] Create error types for different scenarios:
    - [x] `PromptImprovementError` - Base error for prompt improvement
    - [x] `RateLimitError` - Rate limiting exceeded
    - [x] `AuthenticationError` - Session/auth issues
    - [x] `ValidationError` - Input validation failures
    - [x] `NetworkError` - Connection/timeout issues
    - [x] `ServerError` - Backend/API errors

### Phase 2: Rate Limiting Integration

- [x] Install `@convex-dev/rate-limiter` package
- [x] Configure rate limiter in Convex backend
- [x] Implement rate limiting for prompt improvement endpoint
- [x] Add rate limit configuration:
    - [x] Per-user limits (e.g., 10 improvements per minute)
    - [x] Global limits for system protection
    - [x] Different limits for authenticated vs anonymous users
- [x] Handle rate limit responses in frontend

### Phase 3: Sonner Toast Integration

- [x] Install `sonner` package for toast notifications
- [x] Create toast provider and wrapper components
- [x] Implement toast notifications for:
    - [x] Success states (improvement completed)
    - [x] Error states (with specific error messages)
    - [x] Rate limit warnings
    - [x] Network/connectivity issues
- [x] Add toast positioning and styling

### Phase 4: Enhanced User Experience

- [x] Implement retry mechanisms with exponential backoff
- [x] Add progress indicators for long-running operations
- [x] Create error recovery flows
- [x] Add input validation with real-time feedback
- [x] Implement graceful degradation for offline scenarios

### Phase 5: Backend Error Handling

- [x] Update Convex functions to return structured error responses
- [x] Add proper error logging and monitoring
- [x] Implement error categorization and response codes
- [x] Add request validation and sanitization

### Phase 6: Testing & Monitoring

- [x] Add error boundary components
- [x] Implement error tracking and analytics
- [ ] Add unit tests for error scenarios
- [ ] Test rate limiting behavior under load
- [ ] Add monitoring for error rates and patterns

### References

- [Convex Rate Limiter](https://github.com/get-convex/rate-limiter)
- [Agent Rate Limiting Example](https://github.com/get-convex/agent/tree/main/examples/rate-limiting)
- [Sonner Toast Library](https://sonner.emilkowal.ski/)

---

## Current Features

- [x] Multi-model streaming chat with @convex-dev/agent
- [x] Prompt improvement dialog with current/improved prompt separation
- [x] Clean input value tracking without DOM manipulation
- [x] Proper button event handling to prevent form submission
- [x] Cancel/Apply functionality with original prompt restoration

## Next Steps

- [ ] Implement enhanced error handling system
- [ ] Add rate limiting protection
- [ ] Improve user feedback with toast notifications

_Last updated: Current session_
