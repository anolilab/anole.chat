import { Artifact } from "../../components/artifact";
import { SheetEditor } from "./sheet-editor";
import { ClockRewind, Copy, Download, Redo, Undo, Table } from "lucide-react";
import { toast } from "sonner";

export const sheetArtifact = new Artifact<"sheet">({
    kind: "sheet",
    description: "Ideal for creating and managing spreadsheet data, tables, and CSV content.",
    initialize: async ({ setMetadata }) => {
        setMetadata({});
    },
    onStreamPart: ({ streamPart, setArtifact }) => {
        if (streamPart.type === "data-sheetDelta") {
            setArtifact((draftArtifact) => {
                return {
                    ...draftArtifact,
                    content: streamPart.data as string,
                    isVisible:
                        draftArtifact.status === "streaming" &&
                        draftArtifact.content.length > 100 &&
                        draftArtifact.content.length < 150
                            ? true
                            : draftArtifact.isVisible,
                    status: "streaming",
                };
            });
        }
    },
    content: SheetEditor,
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
            description: "Download CSV",
            onClick: ({ content }) => {
                const blob = new Blob([content], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "data.csv";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                toast.success("CSV downloaded!");
            },
        },
    ],
    toolbar: [
        {
            icon: <Table size={18} />,
            description: "Format as table",
            onClick: ({ sendMessage }) => {
                sendMessage({
                    role: "user",
                    content: "Please format this data as a well-structured table with proper headers and formatting.",
                });
            },
        },
    ],
});