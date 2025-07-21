# TODO: TanStack DB Optimistic UI & Real-Time Sync for Chat

## Goal
Implement TanStack DB (`@tanstack/react-db`, `@tanstack/db-collections`) for chat message state, enabling true optimistic UI and real-time sync across multiple open `/chat` windows. When two windows are open on the same thread, both should show identical output and speed, including optimistic updates.

---

## 1. **Analysis & Preparation**
- [x] Review current chat state management (ConvexExternalRuntimeProvider, useThreadContext, useMessageHandlers, useConvexThreadSyncer)
  - **Done:** Gathering and analyzing all chat state management logic to understand how messages are currently handled, updated, and synchronized. This is necessary to ensure a robust migration to TanStack DB, avoid regressions, and maintain all existing features (optimistic UI, streaming, real-time sync).
- [x] Identify all places where chat messages are read, written, or updated in the UI
  - **Done:** Key files/components involved:
    - `providers/convex-external-runtime-provider.tsx` (main orchestrator, state sync)
    - `components/thread-context.tsx` (thread/message state context)
    - `hooks/use-message-handlers.ts` (message creation, optimistic updates, streaming)
    - `hooks/use-convex-thread-syncer.ts` (syncs messages from backend)
    - `providers/thread-list-adapter.ts` (thread list management)
    - `components/assistant.tsx` (top-level chat UI)
    - `components/Thread` (renders message list)
  - **Why:** Mapping all read/write/update locations ensures we migrate all stateful logic to TanStack DB, preventing missed updates, UI bugs, or stale data after the migration.
- [x] Audit how optimistic updates and streaming are currently handled
  - **Done:**
    - Optimistic updates: Performed in `useMessageHandlers` (adds user message and assistant placeholder to local state instantly).
    - Streaming: Managed by `useStreamManager` and `useMessageHandlers` (streams AI response, updates placeholder in real time).
    - Backend sync: `ConvexExternalRuntimeProvider` and `useConvexThreadSyncer` listen for backend changes and update state, with guards to prevent overwriting optimistic UI with stale data.
  - **Why:** Understanding the optimistic/streaming flow is crucial for TanStack DB migration, so we can replicate instant UI feedback, real-time streaming, and robust sync without regressions or race conditions.
- [x] Decide on the schema for the TanStack DB chat message collection (fields, types, keys)
  - **Done:**
    - **Schema fields:**
      - `id: string` (unique message ID, primary key)
      - `threadId: string` (ID of the thread this message belongs to)
      - `role: "user" | "assistant" | "system"` (message sender type)
      - `content: Array<{ text?: string; image?: string; type: "text" | "image" }>` (message content, supports streaming and vision)
      - `createdAt: number | Date` (timestamp for ordering and sync)
      - `attachments?: any[]` (optional, for file uploads)
      - `status?: string` (pending, complete, error, etc. for optimistic UI)
      - `order?: number` (for message ordering in thread)
      - `stepOrder?: number` (for streaming/stepwise updates)
      - `tool?: boolean` (for tool messages)
      - `metadata?: object` (for extra info, e.g. fileId)
    - **Why:** This schema covers all frontend needs (optimistic UI, streaming, attachments, ordering) and matches backend (Convex) data shape, ensuring seamless migration and minimal mapping logic.

## 2. **TanStack DB Collection Setup**
- [x] Define schema for chat messages (id, threadId, role, content, createdAt, etc.)
  - **Done:** Will create a new `collections` directory under `features/chat` and add `chat-message-collection.ts` to define the Zod schema and initial TanStack DB collection setup. This mirrors the structure used for layout UI state collections and keeps chat data logic modular and maintainable.
- [ ] Add TanStack DB chat message collection using `queryCollectionOptions`
    - [ ] Implement `queryFn` to fetch messages for a thread from backend (Convex/REST)
    - [ ] Implement `getKey` for message identity
    - [ ] Add mutation handlers (`onInsert`, `onUpdate`, `onDelete`) to sync with backend
    - [ ] Ensure collection supports optimistic updates and real-time sync
- [ ] **Persist threads in localStorage for fast open**
    - [ ] Use `localStorageCollectionOptions` or hybrid approach to cache thread metadata and recent messages
    - [ ] On app load, hydrate from localStorage for instant thread access before backend sync
    - [ ] Keep localStorage in sync with backend updates

## 3. **React Integration**
- [ ] Refactor chat UI to use `useLiveQuery` for messages (replace direct Convex state)
- [ ] Update message send/edit/reload logic to use TanStack DB mutations (optimistic by default)
- [ ] Ensure all message updates are reflected instantly in all open windows
- [ ] Remove/replace any redundant state or context now handled by TanStack DB

## 4. **Optimistic UI & Sync Logic**
- [ ] Implement optimistic mutation strategy (ID-based or transaction ID-based)
- [ ] Ensure optimistic messages are dropped/replaced when backend confirms
- [ ] Handle error/rollback scenarios for failed mutations
- [ ] Test for race conditions and deduplication (see TanStack DB best practices)

## 5. **Real-Time Cross-Window Sync**
- [ ] Verify that changes in one window are reflected in all others (test with two `/chat` tabs)
- [ ] Ensure streaming updates (AI responses) are visible in real-time in all windows
- [ ] Handle edge cases: network loss, reconnect, out-of-order events

## 6. **Testing & Validation**
- [ ] Write unit tests for collection logic and optimistic updates
- [ ] Write integration tests for multi-window sync and UI consistency
- [ ] Manually test with multiple windows/tabs for identical speed and output
- [ ] Validate performance (no lag, minimal re-renders)

## 7. **Documentation & Cleanup**
- [ ] Document new architecture and usage in memory-bank and codebase
- [ ] Update README and developer docs for chat feature
- [ ] Remove obsolete code and state management
- [ ] Review for code quality, type safety, and best practices

---

## References
- See `.cursor/rules/tanstack-db.mdc` for TanStack DB usage guidelines
- Use `queryCollectionOptions`, `useLiveQuery`, and optimistic mutation patterns as described
- Follow best practices for normalized data, fine-grained reactivity, and transaction lifecycle
- **Persisting threads in localStorage is recommended for instant thread access and improved perceived performance** 