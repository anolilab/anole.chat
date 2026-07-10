# AI Artifacts System

This directory contains the AI artifacts system, which allows users to create and manage different types of documents (artifacts) through AI interactions. The system is inspired by the [Sparka project](https://github.com/FranciscoMoretti/sparka) and provides a flexible framework for handling various content types.

## Overview

The artifacts system consists of three main types:
- **Text Artifacts**: For creating and editing text documents, essays, emails, etc.
- **Code Artifacts**: For generating and editing code in various programming languages
- **Sheet Artifacts**: For creating and managing spreadsheet data and CSV content

## Architecture

### Core Components

1. **Artifact Class** (`components/artifact.tsx`): The base class for defining artifact types
2. **ArtifactManager** (`components/artifact-manager.tsx`): Main component for managing artifact display and interactions
3. **Type Definitions** (`types/artifacts.ts`): TypeScript interfaces and types
4. **Hooks** (`hooks/use-artifact.ts`): Custom hooks for artifact state management

### Database Schema

The system uses Convex for data persistence with the following tables:
- `documents`: Stores the main document content and metadata
- `documentVersions`: Tracks version history of documents
- `suggestions`: Stores AI-generated suggestions for document improvements

## Usage

### Basic Usage

```tsx
import { ArtifactManager, useArtifact, useDocuments, useSaveDocument } from "@/features/ai";

function MyComponent() {
    const { artifact, setArtifact } = useArtifact();
    const { data: documents, isLoading } = useDocuments(artifact.documentId);
    const saveDocumentMutation = useSaveDocument(artifact.documentId, artifact.messageId);

    const handleSaveContent = (content: string, debounce: boolean) => {
        saveDocumentMutation.mutate({
            id: artifact.documentId,
            title: artifact.title,
            content,
            kind: artifact.kind,
        });
    };

    return (
        <ArtifactManager
            artifact={artifact}
            setArtifact={setArtifact}
            documents={documents || []}
            isLoading={isLoading}
            onSaveContent={handleSaveContent}
            sendMessage={handleSendMessage}
            isAuthenticated={true}
        />
    );
}
```

### Creating a New Artifact

```tsx
const createArtifact = (kind: ArtifactKind) => {
    const newArtifact: UIArtifact = {
        title: `New ${kind} Document`,
        documentId: `doc_${Date.now()}`,
        kind,
        content: "",
        messageId: `msg_${Date.now()}`,
        isVisible: true,
        status: "idle",
        boundingBox: {
            top: 0,
            left: 0,
            width: 800,
            height: 600,
        },
    };
    setArtifact(newArtifact);
};
```

## Creating Custom Artifacts

To create a new artifact type, follow these steps:

### 1. Define the Artifact Configuration

```tsx
// artifacts/my-artifact/client.tsx
import { Artifact } from "../../components/artifact";
import { MyArtifactEditor } from "./my-artifact-editor";

export const myArtifact = new Artifact<"my-artifact">({
    kind: "my-artifact",
    description: "Description of what this artifact does",
    content: MyArtifactEditor,
    actions: [
        {
            icon: <MyIcon size={18} />,
            description: "Action description",
            onClick: ({ content }) => {
                // Handle action
            },
        },
    ],
    toolbar: [
        {
            icon: <ToolIcon size={18} />,
            description: "Tool description",
            onClick: ({ sendMessage }) => {
                sendMessage({
                    role: "user",
                    content: "Tool message",
                });
            },
        },
    ],
    onStreamPart: ({ streamPart, setArtifact }) => {
        // Handle streaming data
        if (streamPart.type === "data-myArtifactDelta") {
            setArtifact((draft) => ({
                ...draft,
                content: draft.content + streamPart.data,
            }));
        }
    },
});
```

### 2. Create the Editor Component

```tsx
// artifacts/my-artifact/my-artifact-editor.tsx
import type { ArtifactContent } from "../../types/artifacts";

export function MyArtifactEditor(props: ArtifactContent) {
    const { content, onSaveContent, isReadonly } = props;
    
    return (
        <div>
            {/* Your custom editor UI */}
        </div>
    );
}
```

### 3. Update Type Definitions

Add your new artifact type to the `ArtifactKind` union:

```tsx
// types/artifacts.ts
export type ArtifactKind = "text" | "code" | "sheet" | "my-artifact";
```

### 4. Update Database Schema

Add your new artifact type to the Convex schema:

```tsx
// convex/convex/artifacts/schema.ts
kind: v.union(
    v.literal("text"),
    v.literal("code"),
    v.literal("sheet"),
    v.literal("my-artifact") // Add your new type
),
```

## Integration with Chat System

The artifacts system is designed to integrate with chat interfaces. When an AI generates content, it can create artifacts that users can then edit and refine.

### Stream Handling

Artifacts can receive streaming data from AI responses:

```tsx
onStreamPart: ({ streamPart, setArtifact }) => {
    if (streamPart.type === "data-textDelta") {
        setArtifact((draft) => ({
            ...draft,
            content: draft.content + streamPart.data,
            status: "streaming",
        }));
    }
},
```

### Message Integration

Artifacts can send messages back to the chat system:

```tsx
toolbar: [
    {
        icon: <PenTool size={18} />,
        description: "Improve content",
        onClick: ({ sendMessage }) => {
            sendMessage({
                role: "user",
                content: "Please improve this content",
            });
        },
    },
],
```

## Features

### Version Control
- Automatic version tracking for all documents
- Ability to view and compare different versions
- Diff view for seeing changes between versions

### Suggestions
- AI-generated suggestions for content improvements
- Accept/reject functionality for suggestions
- Different suggestion types (improvement, correction, enhancement)

### Actions and Tools
- Copy to clipboard
- Download files
- Version navigation
- Content-specific actions (e.g., run code, format table)

### Real-time Editing
- Live content editing with auto-save
- Streaming content updates
- Collaborative editing support (future)

## Database Operations

### Saving Documents
```tsx
const saveDocument = useMutation({
    mutationFn: async ({ id, title, content, kind }) => {
        return await ctx.db.insert("documents", {
            content,
            kind,
            title,
            userId: ctx.user._id,
        });
    },
});
```

### Fetching Documents
```tsx
const getDocuments = useQuery({
    queryKey: ["documents", documentId],
    queryFn: async () => {
        return await ctx.db
            .query("documents")
            .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
            .collect();
    },
});
```

## Future Enhancements

- **Collaborative Editing**: Real-time collaboration on artifacts
- **Advanced Versioning**: Branching and merging capabilities
- **Template System**: Pre-defined templates for common document types
- **Export Options**: Multiple export formats (PDF, DOCX, etc.)
- **Advanced Suggestions**: More sophisticated AI suggestions with context
- **Plugin System**: Extensible architecture for custom artifact types

## Contributing

When adding new features to the artifacts system:

1. Follow the existing patterns and conventions
2. Add proper TypeScript types
3. Include comprehensive tests
4. Update documentation
5. Consider backward compatibility

## Dependencies

- **Convex**: Database and real-time functionality
- **React Query**: Data fetching and caching
- **Lucide React**: Icons
- **Tailwind CSS**: Styling
- **Shadcn/ui**: UI components