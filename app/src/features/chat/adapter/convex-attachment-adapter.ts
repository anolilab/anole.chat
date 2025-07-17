import { api } from "@anole/convex/api";
import type { AttachmentAdapter, CompleteAttachment, PendingAttachment } from "@assistant-ui/react";
import type { ConvexReactClient } from "convex/react";

const getFileText = (file: File): Promise<string> =>
    new Promise<string>((resolve, reject) => {
        const reader = new FileReader();

        reader.addEventListener("load", () => {
            resolve(reader.result as string);
        });
        reader.onerror = (error) => {
            reject(error);
        };
        reader.readAsText(file);
    });

const getFileBytes = (file: File): Promise<ArrayBuffer> =>
    new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();

        reader.addEventListener("load", () => {
            resolve(reader.result as ArrayBuffer);
        });
        reader.onerror = (error) => {
            reject(error);
        };
        reader.readAsArrayBuffer(file);
    });

const fileToBase64DataURL = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.addEventListener("load", () => {
            resolve(reader.result as string);
        });
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
            contentType: state.file.type,
            file: state.file,
            id: crypto.randomUUID(),
            name: state.file.name,
            status: { reason: "composer-send", type: "requires-action" },
            type: isImage ? "image" : "document",
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
                    bytes,
                    filename: attachment.name,
                    mimeType: attachment.contentType || "image/jpeg",
                });

                return {
                    ...attachment,
                    content: [
                        {
                            image: base64DataURL, // Base64 data URL for vision models
                            type: "image",
                        },
                    ],
                    // Store the fileId for backend processing
                    metadata: { fileId: uploadResult.fileId },
                    status: { type: "complete" },
                } as CompleteAttachment;
            }

            // For text files, include the content inline
            if (isText) {
                const textContent = await getFileText(attachment.file);

                // Upload to Convex storage as well
                const bytes = await getFileBytes(attachment.file);
                const uploadResult = await this.convex.action(api.file.uploadFile, {
                    bytes,
                    filename: attachment.name,
                    mimeType: attachment.contentType || "text/plain",
                });

                return {
                    ...attachment,
                    content: [
                        {
                            text: `<attachment name="${attachment.name}">\n${textContent}\n</attachment>`,
                            type: "text",
                        },
                    ],
                    metadata: { fileId: uploadResult.fileId },
                    status: { type: "complete" },
                } as CompleteAttachment;
            }

            // For other files (like PDFs), just upload and show filename
            const bytes = await getFileBytes(attachment.file);
            const uploadResult = await this.convex.action(api.file.uploadFile, {
                bytes,
                filename: attachment.name,
                mimeType: attachment.contentType || "application/octet-stream",
            });

            return {
                ...attachment,
                content: [
                    {
                        text: `[Document: ${attachment.name}]`,
                        type: "text",
                    },
                ],
                metadata: { fileId: uploadResult.fileId },
                status: { type: "complete" },
            } as CompleteAttachment;
        } catch (error) {
            console.error("Failed to upload file:", error);

            // Return error status with clear error message
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

            return {
                ...attachment,
                content: [
                    {
                        text: `❌ Failed to upload "${attachment.name}": ${errorMessage}`,
                        type: "text",
                    },
                ],
                status: { type: "complete" }, // Assistant UI expects complete status even for errors
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
