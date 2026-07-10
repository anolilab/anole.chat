import { Artifact } from "../../components/artifact";
import { CodeEditor } from "./code-editor";
import { ClockRewind, Copy, Download, Play, Redo, Undo } from "lucide-react";
import { toast } from "sonner";

export const codeArtifact = new Artifact<"code">({
    kind: "code",
    description: "Perfect for generating and editing code in various programming languages.",
    initialize: async ({ setMetadata }) => {
        setMetadata({});
    },
    onStreamPart: ({ streamPart, setArtifact }) => {
        if (streamPart.type === "data-codeDelta") {
            setArtifact((draftArtifact) => {
                return {
                    ...draftArtifact,
                    content: streamPart.data as string,
                    isVisible:
                        draftArtifact.status === "streaming" &&
                        draftArtifact.content.length > 200 &&
                        draftArtifact.content.length < 250
                            ? true
                            : draftArtifact.isVisible,
                    status: "streaming",
                };
            });
        }
    },
    content: CodeEditor,
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
        {
            icon: <Download size={18} />,
            description: "Download file",
            onClick: ({ content }) => {
                const blob = new Blob([content], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "code.txt";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                toast.success("File downloaded!");
            },
        },
    ],
    toolbar: [
        {
            icon: <Play size={18} />,
            description: "Run code",
            onClick: ({ sendMessage }) => {
                sendMessage({
                    role: "user",
                    content: "Please run this code and show me the output.",
                });
            },
        },
    ],
});