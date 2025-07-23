// Artifact types and interfaces
export type {
    ArtifactKind,
    Document,
    DocumentVersion,
    Suggestion,
    UIArtifact,
    ArtifactAction,
    ArtifactToolbarItem,
    ArtifactContent,
} from "./types/artifacts";

// Artifact components
export { Artifact } from "./components/artifact";
export { ArtifactManager } from "./components/artifact-manager";

// Artifact definitions
export { textArtifact } from "./artifacts/text/client";
export { codeArtifact } from "./artifacts/code/client";
export { sheetArtifact } from "./artifacts/sheet/client";

// Artifact hooks
export { useArtifact, useDocuments, useSaveDocument, useArtifactStream } from "./hooks/use-artifact";

// Artifact editors
export { TextEditor } from "./artifacts/text/text-editor";
export { CodeEditor } from "./artifacts/code/code-editor";
export { SheetEditor } from "./artifacts/sheet/sheet-editor";