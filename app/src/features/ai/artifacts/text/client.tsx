import { Artifact } from "../../components/artifact";
import { TextEditor } from "./text-editor";
import { ClockRewind, Copy, MessageSquare, PenTool, Redo, Undo } from "lucide-react";
import { toast } from "sonner";
import type { Suggestion } from "../../../types/artifacts";

interface TextArtifactMetadata {
    suggestions: Array<Suggestion>;
}

export const textArtifact = new Artifact<"text", TextArtifactMetadata>({
    kind: "text",
    description: "Useful for text content, like drafting essays and emails.",
    initialize: async ({ setMetadata, isAuthenticated }) => {
        if (!isAuthenticated) {
            setMetadata({
                suggestions: [],
            });
            return;
        }

        // TODO: Fetch suggestions from Convex
        setMetadata({
            suggestions: [],
        });
    },
    onStreamPart: ({ streamPart, setMetadata, setArtifact }) => {
        if (streamPart.type === "data-suggestion") {
            setMetadata((metadata) => {
                return {
                    suggestions: [...metadata.suggestions, streamPart.data as Suggestion],
                };
            });
        }

        if (streamPart.type === "data-textDelta") {
            setArtifact((draftArtifact) => {
                return {
                    ...draftArtifact,
                    content: draftArtifact.content + (streamPart.data as string),
                    isVisible:
                        draftArtifact.status === "streaming" &&
                        draftArtifact.content.length > 400 &&
                        draftArtifact.content.length < 450
                            ? true
                            : draftArtifact.isVisible,
                    status: "streaming",
                };
            });
        }
    },
    content: TextEditor,
    actions: [
        {
            icon: <ClockRewind size={18} />,
            description: "View changes",
            onClick: ({ handleVersionChange }) => {
                handleVersionChange("toggle");
            },
            isDisabled: ({ currentVersionIndex }) => {
                return currentVersionIndex === 0;
            },
        },
        {
            icon: <Undo size={18} />,
            description: "View Previous version",
            onClick: ({ handleVersionChange }) => {
                handleVersionChange("prev");
            },
            isDisabled: ({ currentVersionIndex }) => {
                return currentVersionIndex === 0;
            },
        },
        {
            icon: <Redo size={18} />,
            description: "View Next version",
            onClick: ({ handleVersionChange }) => {
                handleVersionChange("next");
            },
            isDisabled: ({ isCurrentVersion }) => {
                return isCurrentVersion;
            },
        },
        {
            icon: <Copy size={18} />,
            description: "Copy to clipboard",
            onClick: ({ content }) => {
                navigator.clipboard.writeText(content);
                toast.success("Copied to clipboard!");
            },
        },
    ],
    toolbar: [
        {
            icon: <PenTool size={18} />,
            description: "Add final polish",
            onClick: ({ sendMessage }) => {
                sendMessage({
                    role: "user",
                    content: "Please add final polish and check for grammar, add section titles for better structure, and ensure everything reads smoothly.",
                });
            },
        },
        {
            icon: <MessageSquare size={18} />,
            description: "Request suggestions",
            onClick: ({ sendMessage }) => {
                sendMessage({
                    role: "user",
                    content: "Please add suggestions you have that could improve the writing.",
                });
            },
        },
    ],
});