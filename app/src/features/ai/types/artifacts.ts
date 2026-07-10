import type { ReactNode } from "react";

export type ArtifactKind = "text" | "code" | "sheet";

export interface Document {
    _id: string;
    _creationTime: number;
    content: string;
    kind: ArtifactKind;
    messageId?: string;
    title: string;
    userId: string;
}

export interface DocumentVersion {
    _id: string;
    _creationTime: number;
    content: string;
    documentId: string;
    messageId?: string;
    version: number;
}

export interface Suggestion {
    _id: string;
    _creationTime: number;
    content: string;
    documentId: string;
    messageId?: string;
    type: "improvement" | "correction" | "enhancement";
}

export interface UIArtifact {
    title: string;
    documentId: string;
    kind: ArtifactKind;
    content: string;
    messageId: string;
    isVisible: boolean;
    status: "streaming" | "idle";
    boundingBox: {
        top: number;
        left: number;
        width: number;
        height: number;
    };
}

export interface ArtifactActionContext<M = any> {
    content: string;
    handleVersionChange: (type: "next" | "prev" | "toggle" | "latest") => void;
    currentVersionIndex: number;
    isCurrentVersion: boolean;
    mode: "edit" | "diff";
    metadata: M;
    setMetadata: React.Dispatch<React.SetStateAction<M>>;
    isReadonly?: boolean;
}

export interface ArtifactAction<M = any> {
    icon: ReactNode;
    label?: string;
    description: string;
    onClick: (context: ArtifactActionContext<M>) => Promise<void> | void;
    isDisabled?: (context: ArtifactActionContext<M>) => boolean;
}

export interface ArtifactToolbarContext {
    sendMessage: (message: any) => void;
}

export interface ArtifactToolbarItem {
    description: string;
    icon: ReactNode;
    onClick: (context: ArtifactToolbarContext) => void;
}

export interface ArtifactContent<M = any> {
    title: string;
    content: string;
    mode: "edit" | "diff";
    isCurrentVersion: boolean;
    currentVersionIndex: number;
    status: "streaming" | "idle";
    suggestions: Array<Suggestion>;
    onSaveContent: (updatedContent: string, debounce: boolean) => void;
    isInline: boolean;
    getDocumentContentById: (index: number) => string;
    isLoading: boolean;
    metadata: M;
    setMetadata: React.Dispatch<React.SetStateAction<M>>;
    isReadonly?: boolean;
}

export interface InitializeParameters<M = any> {
    documentId: string;
    setMetadata: React.Dispatch<React.SetStateAction<M>>;
    isAuthenticated: boolean;
}

export interface ArtifactConfig<T extends string, M = any> {
    kind: T;
    description: string;
    content: React.ComponentType<ArtifactContent<M>>;
    actions: Array<ArtifactAction<M>>;
    toolbar: ArtifactToolbarItem[];
    initialize?: (parameters: InitializeParameters<M>) => void;
    onStreamPart: (args: {
        setMetadata: React.Dispatch<React.SetStateAction<M>>;
        setArtifact: React.Dispatch<React.SetStateAction<UIArtifact>>;
        streamPart: any;
    }) => void;
}

export interface StreamWriter {
    write: (data: any) => void;
}

export interface CreateDocumentCallbackProps {
    id: string;
    title: string;
    dataStream: StreamWriter;
    description: string;
    prompt: string;
    messageId: string;
    selectedModel: string;
}

export interface UpdateDocumentCallbackProps {
    document: Document;
    description: string;
    dataStream: StreamWriter;
    messageId: string;
    selectedModel: string;
}

export interface DocumentHandler<T = ArtifactKind> {
    kind: T;
    onCreateDocument: (args: CreateDocumentCallbackProps) => Promise<void>;
    onUpdateDocument: (args: UpdateDocumentCallbackProps) => Promise<void>;
}