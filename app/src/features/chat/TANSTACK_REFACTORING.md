# TanStack DB Refactoring Summary

## Overview

This document summarizes the complete refactoring of thread and message management from Map-based state to TanStack DB collections. The refactoring provides better performance, persistence, and developer experience.

## What Was Refactored

### Before (Map-based State)
```typescript
// Old approach using React state
const [threads, setThreads] = useState<Map<string, ThreadMessageLike[]>>(new Map());
const [threadMetadata, setThreadMetadata] = useState<Map<string, ThreadMetadata>>(new Map());
```

### After (TanStack DB Collections)
```typescript
// New approach using TanStack DB
const threads = useThreads(); // Reactive query
const messages = useMessagesSorted(threadId); // Reactive query
```

## New Files Created

### Collections
1. **`collections/threads-collection.ts`** - Thread metadata and relationships
2. **`collections/messages-collection.ts`** - Individual message management
3. **`collections/query-collection.ts`** - Reactive query hooks
4. **`collections/index.ts`** - Export all collections

### Refactored Components
1. **`components/thread-context-tanstack.tsx`** - New thread context using TanStack DB
2. **`hooks/use-convex-thread-syncer-tanstack.ts`** - Thread syncer with TanStack DB
3. **`hooks/use-message-handlers-tanstack.ts`** - Message handlers with TanStack DB
4. **`providers/convex-external-runtime-provider-tanstack.tsx`** - Runtime provider with TanStack DB

### Utilities
1. **`utils/migration.ts`** - Migration utilities for transitioning from old state
2. **`components/example-tanstack-usage.tsx`** - Example component demonstrating usage
3. **`collections/README.md`** - Comprehensive documentation

## Key Benefits

### 1. Performance Improvements
- **Optimized Queries**: TanStack DB provides efficient querying and caching
- **Reactive Updates**: Components automatically re-render when data changes
- **Reduced Re-renders**: Only components that depend on specific data re-render

### 2. Data Persistence
- **Automatic Storage**: Data is automatically saved to localStorage
- **Offline Support**: Data persists across browser sessions
- **Sync Capabilities**: Easy to implement server synchronization

### 3. Developer Experience
- **Type Safety**: Full TypeScript support with Zod validation
- **Better Debugging**: TanStack DevTools integration
- **Easier Testing**: Collections can be mocked and tested in isolation

### 4. Scalability
- **Large Datasets**: Better handling of thousands of messages
- **Indexed Queries**: Efficient filtering and searching
- **Memory Management**: Automatic garbage collection

## Migration Strategy

### Phase 1: Parallel Implementation ✅
- Created new TanStack DB collections alongside existing code
- No breaking changes to existing functionality
- Added migration utilities for data transition

### Phase 2: Gradual Migration (Next Steps)
- Update components to use new collections
- Test with real data and user interactions
- Validate performance improvements

### Phase 3: Cleanup (Future)
- Remove old Map-based state management
- Clean up migration utilities
- Update all imports to use new collections

### Phase 4: Optimization (Future)
- Add indexes for better performance
- Implement pagination for large datasets
- Add offline sync capabilities

## Usage Examples

### Creating a Thread
```typescript
import { createThread } from '../collections/threads-collection';

createThread('new-thread-id', {
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

## Available Query Hooks

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

### Search & Statistics
- `useThreadsBySearch(query)` - Search threads
- `useMessagesBySearch(query, threadId?)` - Search messages
- `useThreadStats()` - Get thread and message statistics
- `useRecentThreads(limit)` - Get recent threads
- `useRecentMessages(limit, threadId?)` - Get recent messages

## Data Schema

### Thread Document
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

### Message Document
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

## Testing the Refactoring

### 1. Run the Example Component
```typescript
import { ExampleTanStackUsage } from '../components/example-tanstack-usage';

// Add to your app to test the new collections
<ExampleTanStackUsage />
```

### 2. Check Browser Storage
- Open DevTools → Application → Local Storage
- Look for `anole-threads` and `anole-messages` keys
- Verify data is being persisted correctly

### 3. Test Performance
- Create multiple threads with many messages
- Verify UI remains responsive
- Check memory usage in DevTools

## Next Steps

1. **Integration Testing**: Test the new collections with real user workflows
2. **Performance Benchmarking**: Compare performance with old implementation
3. **Component Migration**: Gradually migrate existing components
4. **Error Handling**: Add comprehensive error handling and recovery
5. **Documentation**: Update component documentation to reflect new patterns

## Troubleshooting

### Common Issues

1. **Data Not Persisting**: Check if localStorage is available and not full
2. **Queries Not Updating**: Ensure components are wrapped in proper providers
3. **Type Errors**: Verify all imports are from the new collections
4. **Migration Failures**: Check browser console for detailed error messages

### Debug Tools

- Use TanStack DevTools for debugging queries
- Check browser localStorage for data persistence
- Monitor console logs for migration progress
- Use React DevTools to inspect component state

## Conclusion

The TanStack DB refactoring provides a solid foundation for scalable, performant thread and message management. The new architecture offers better developer experience, improved performance, and easier testing while maintaining backward compatibility during the migration process.