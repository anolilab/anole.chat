# TanStack DB Collections for Chat

This directory contains the refactored thread and message management using TanStack DB collections instead of the previous Map-based state management.

## Overview

The refactoring replaces the old `Map<string, ThreadMessageLike[]>` state management with proper TanStack DB collections that provide:

- **Persistent storage** in localStorage
- **Reactive queries** with `useLiveQuery`
- **Type safety** with Zod schemas
- **Better performance** with optimized queries
- **Easier testing** with isolated collections

## Collections

### Threads Collection (`threads-collection.ts`)

Manages thread metadata and relationships:

```typescript
interface ThreadDocument {
  id: string;
  metadata: ThreadMetadata;
  messages: any[]; // Will be properly typed when messages collection is integrated
}

interface ThreadMetadata {
  branchName?: string;
  branchPoint?: number;
  createdAt: Date;
  lastActivity: Date;
  parentThreadId?: string;
  status: "active" | "archived";
  title: string;
}
```

**Key Functions:**
- `createThread(id, metadata)` - Create a new thread
- `updateThreadMetadata(id, metadata)` - Update thread metadata
- `deleteThread(id)` - Delete a thread
- `getThread(id)` - Get a specific thread
- `getAllThreads()` - Get all threads

### Messages Collection (`messages-collection.ts`)

Manages individual messages:

```typescript
interface MessageDocument {
  id: string;
  threadId: string;
  role: "user" | "assistant" | "system";
  content: MessageContent[];
  createdAt: Date;
  updatedAt?: Date;
  isStreaming: boolean;
  metadata?: Record<string, unknown>;
}

interface MessageContent {
  text: string;
  type: "text";
}
```

**Key Functions:**
- `createMessage(message)` - Create a new message
- `updateMessage(id, updates)` - Update a message
- `deleteMessage(id)` - Delete a message
- `getMessagesByThreadId(threadId)` - Get all messages for a thread
- `deleteMessagesByThreadId(threadId)` - Delete all messages for a thread

## Query Hooks (`query-collection.ts`)

Provides reactive query hooks for efficient data access:

### Thread Queries
- `useThreads()` - Get all threads
- `useThread(id)` - Get a specific thread
- `useThreadsByParent(parentId)` - Get threads by parent
- `useActiveThreads()` - Get only active threads
- `useArchivedThreads()` - Get only archived threads

### Message Queries
- `useMessages(threadId)` - Get messages for a thread
- `useMessagesSorted(threadId)` - Get sorted messages for a thread
- `useMessage(id)` - Get a specific message
- `useStreamingMessages(threadId)` - Get streaming messages

### Combined Queries
- `useThreadWithMessages(threadId)` - Get thread with its messages
- `useThreadHierarchy(rootThreadId?)` - Get hierarchical thread structure

### Search & Filter Queries
- `useThreadsBySearch(query)` - Search threads
- `useMessagesBySearch(query, threadId?)` - Search messages

### Statistics Queries
- `useThreadStats()` - Get thread and message statistics
- `useRecentThreads(limit)` - Get recent threads
- `useRecentMessages(limit, threadId?)` - Get recent messages

## Migration

The `migration.ts` utility helps transition from the old Map-based state:

```typescript
import { performFullMigration } from '../utils/migration';

// Migrate from old state
const result = await performFullMigration(oldThreads, oldMetadata);
if (result.success) {
  console.log('Migration successful:', result.message);
} else {
  console.error('Migration failed:', result.message);
}
```

## Usage Examples

### Creating a New Thread

```typescript
import { createThread } from '../collections/threads-collection';

const threadId = createThread('new-thread-id', {
  title: 'My New Chat',
  status: 'active',
  createdAt: new Date(),
  lastActivity: new Date(),
});
```

### Adding a Message

```typescript
import { createMessage, convertToMessageDocument } from '../collections/messages-collection';

const message: ThreadMessageLike = {
  id: 'msg-123',
  role: 'user',
  content: [{ text: 'Hello!', type: 'text' }],
};

const messageDoc = convertToMessageDocument(message, threadId);
createMessage(messageDoc);
```

### Using Query Hooks

```typescript
import { useThreads, useMessagesSorted } from '../collections/query-collection';

function MyComponent() {
  const threads = useThreads();
  const messages = useMessagesSorted(currentThreadId);
  
  if (!threads || !messages) return <div>Loading...</div>;
  
  return (
    <div>
      <h2>Threads ({threads.length})</h2>
      <h3>Messages ({messages.length})</h3>
    </div>
  );
}
```

## Benefits of the Refactoring

1. **Performance**: TanStack DB provides optimized queries and caching
2. **Persistence**: Data is automatically saved to localStorage
3. **Reactivity**: Components automatically re-render when data changes
4. **Type Safety**: Full TypeScript support with Zod validation
5. **Testing**: Collections can be easily mocked and tested in isolation
6. **Scalability**: Better handling of large datasets
7. **Developer Experience**: Better debugging and development tools

## Migration Strategy

1. **Phase 1**: Create new collections alongside existing code
2. **Phase 2**: Gradually migrate components to use new collections
3. **Phase 3**: Remove old Map-based state management
4. **Phase 4**: Clean up migration utilities

## Future Enhancements

- Add indexes for better query performance
- Implement pagination for large datasets
- Add offline sync capabilities
- Integrate with server-side caching
- Add data compression for large message histories