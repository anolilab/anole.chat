import type { Doc } from "@anole/convex/dataModel";
import { jsPDF } from "jspdf";

type Message = Doc<"messages">;
type Chat = Doc<"threads">;

export type DownloadFormat = "json" | "txt" | "pdf";

const formatMessage = (message: Message): string => {
    switch (message.role) {
        case "assistant":
        case "user": {
            const textContent = message.content.map((c: any) => c.text).join(String.raw`\n`);

            return `${message.role.charAt(0).toUpperCase() + message.role.slice(1)}: ${textContent}`;
        }
        case "tool": {
            const toolResult = (message.content as any)?.[0]?.content ?? "No result";

            return `Tool Output: ${toolResult}`;
        }
        default: {
            const _exhaustiveCheck: never = message;

            return `Unknown role: ${JSON.stringify(message)}`;
        }
    }
};

export const handleDownload = (thread: Chat, messages: Message[], format: DownloadFormat) => {
    if (!messages || messages.length === 0) {
        console.error("No messages to download.");

        return;
    }

    const sortedMessages = [...messages].sort((a, b) => a._creationTime - b._creationTime);

    const title = thread.title || "Untitled Chat";
    const filename = `${title}.${format}`;

    switch (format) {
        case "json": {
            downloadJson(thread, sortedMessages, filename);
            break;
        }
        case "pdf": {
            downloadPdf(thread, sortedMessages, filename);
            break;
        }
        case "txt": {
            downloadTxt(thread, sortedMessages, filename);
            break;
        }
        default: {
            console.error(`Unsupported download format: ${format}`);
        }
    }
};

const downloadJson = (chat: Chat, messages: Message[], filename: string) => {
    const data = { chat, messages };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
    });

    triggerBrowserDownload(blob, filename);
};

const downloadTxt = (chat: Chat, messages: Message[], filename: string) => {
    const header = [`Title: ${chat.title || "Untitled Chat"}`, `Date: ${new Date(chat._creationTime).toLocaleString()}`, "---", ""];

    const messageLines = messages.map(formatMessage);
    const content = [...header, ...messageLines].join(String.raw`\n`);

    const blob = new Blob([content], { type: "text/plain" });

    triggerBrowserDownload(blob, filename);
};

const downloadPdf = (chat: Chat, messages: Message[], filename: string) => {
    const document_ = new jsPDF();
    const margin = 15;
    const pageWidth = document_.internal.pageSize.getWidth();
    const usableWidth = pageWidth - margin * 2;
    let yPosition = margin;

    document_.setFont("helvetica", "bold");
    document_.setFontSize(16);
    document_.text(chat.title || "Untitled Chat", margin, yPosition);
    yPosition += 10;

    document_.setFont("helvetica", "normal");
    document_.setFontSize(10);
    document_.text(`Date: ${new Date(chat._creationTime).toLocaleString()}`, margin, yPosition);
    yPosition += 10;
    document_.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    messages.forEach((message) => {
        if (yPosition > 270) {
            document_.addPage();
            yPosition = margin;
        }

        const role = message.role.charAt(0).toUpperCase() + message.role.slice(1);
        const fullMessage = formatMessage(message);
        // Ensure that there is a ':' before extracting content
        const contentStartIndex = fullMessage.indexOf(":");
        const content = contentStartIndex === -1 ? fullMessage : fullMessage.slice(Math.max(0, contentStartIndex + 1)).trim();

        document_.setFont("helvetica", "bold");
        document_.setFontSize(11);
        document_.text(`${role}:`, margin, yPosition);

        document_.setFont("helvetica", "normal");
        const textLines = document_.splitTextToSize(content, usableWidth - 15);

        document_.text(textLines, margin + 15, yPosition);

        yPosition += textLines.length * 5 + 5;
    });

    document_.save(filename);
};

const triggerBrowserDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = filename;
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
};
