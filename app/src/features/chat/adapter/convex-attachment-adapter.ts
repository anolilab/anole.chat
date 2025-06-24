import type { AttachmentAdapter, CompleteAttachment, PendingAttachment } from "@assistant-ui/react";
import type { ConvexReactClient } from "convex/react";
import { api } from "@cvx/_generated/api";

const getFileText = (file: File): Promise<string> =>
    new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });

const getFileBytes = (file: File): Promise<ArrayBuffer> =>
    new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });

const fileToBase64DataURL = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

class ConvexAttachmentAdapter implements AttachmentAdapter {
    // Accept common file types - images, text files, and documents
    public accept = "image/*,text/*,application/pdf,application/json,application/xml,.md,.csv,.txt";

    public constructor(private readonly convex: ConvexReactClient) {}

    public async add(state: { file: File }): Promise<PendingAttachment> {
        // Validate file size (20MB limit as recommended by Assistant UI)
        const maxSize = 20 * 1024 * 1024; // 20MB
        if (state.file.size > maxSize) {
            throw new Error(`File size exceeds 20MB limit. Current size: ${Math.round(state.file.size / 1024 / 1024)}MB`);
        }

        // Validate file type
        const isImage = state.file.type.startsWith("image/");
        const isText =
            state.file.type.startsWith("text/") ||
            state.file.type === "application/json" ||
            state.file.type === "application/xml" ||
            state.file.name.endsWith(".md") ||
            state.file.name.endsWith(".txt") ||
            state.file.name.endsWith(".csv");
        const isPdf = state.file.type === "application/pdf";

        if (!isImage && !isText && !isPdf) {
            throw new Error(`Unsupported file type: ${state.file.type}`);
        }

        return {
            id: crypto.randomUUID(),
            type: isImage ? "image" : "document",
            name: state.file.name,
            contentType: state.file.type,
            file: state.file,
            status: { type: "requires-action", reason: "composer-send" },
        };
    }

    public async send(attachment: PendingAttachment): Promise<CompleteAttachment> {
        try {
            const isImage = attachment.contentType?.startsWith("image/");
            const isText =
                attachment.contentType?.startsWith("text/") ||
                attachment.contentType === "application/json" ||
                attachment.contentType === "application/xml" ||
                attachment.name.endsWith(".md") ||
                attachment.name.endsWith(".txt") ||
                attachment.name.endsWith(".csv");

            // For images, we can provide both the base64 data URL for immediate display
            // and upload to Convex for backend processing
            if (isImage) {
                // Convert to base64 for immediate display (vision models)
                const base64DataURL = await fileToBase64DataURL(attachment.file);

                // Also upload to Convex storage for backend processing
                const bytes = await getFileBytes(attachment.file);
                const uploadResult = await this.convex.action(api.file.uploadFile, {
                    filename: attachment.name,
                    mimeType: attachment.contentType || "image/jpeg",
                    bytes: bytes,
                });

                return {
                    ...attachment,
                    status: { type: "complete" },
                    content: [
                        {
                            type: "image",
                            image: base64DataURL, // Base64 data URL for vision models
                        },
                    ],
                    // Store the fileId for backend processing
                    metadata: { fileId: uploadResult.fileId },
                } as CompleteAttachment;
            }

            // For text files, include the content inline
            if (isText) {
                const textContent = await getFileText(attachment.file);

                // Upload to Convex storage as well
                const bytes = await getFileBytes(attachment.file);
                const uploadResult = await this.convex.action(api.file.uploadFile, {
                    filename: attachment.name,
                    mimeType: attachment.contentType || "text/plain",
                    bytes: bytes,
                });

                return {
                    ...attachment,
                    status: { type: "complete" },
                    content: [
                        {
                            type: "text",
                            text: `<attachment name="${attachment.name}">\n${textContent}\n</attachment>`,
                        },
                    ],
                    metadata: { fileId: uploadResult.fileId },
                } as CompleteAttachment;
            }

            // For other files (like PDFs), just upload and show filename
            const bytes = await getFileBytes(attachment.file);
            const uploadResult = await this.convex.action(api.file.uploadFile, {
                filename: attachment.name,
                mimeType: attachment.contentType || "application/octet-stream",
                bytes: bytes,
            });

            return {
                ...attachment,
                status: { type: "complete" },
                content: [
                    {
                        type: "text",
                        text: `[Document: ${attachment.name}]`,
                    },
                ],
                metadata: { fileId: uploadResult.fileId },
            } as CompleteAttachment;
        } catch (error) {
            console.error("Failed to upload file:", error);

            // Return error status with clear error message
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

            return {
                ...attachment,
                status: { type: "complete" }, // Assistant UI expects complete status even for errors
                content: [
                    {
                        type: "text",
                        text: `❌ Failed to upload "${attachment.name}": ${errorMessage}`,
                    },
                ],
            } as CompleteAttachment;
        }
    }

    public async remove(attachment: PendingAttachment): Promise<void> {
        // Cleanup any resources if needed
        // For now, files are cleaned up by the backend automatically
        // Could implement file deletion here if needed
    }
}

export default ConvexAttachmentAdapter;
