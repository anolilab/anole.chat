import type { AttachmentAdapter, CompleteAttachment, PendingAttachment } from "@assistant-ui/react";

interface R2AttachmentAdapterConfig {
    sessionToken: string;
    threadId: string;
    model: string;
    uploadFileAction: (args: any) => Promise<{ fileId: string; url: string }>;
    deleteFileAction: (args: any) => Promise<any>;
    generateR2UploadUrl?: (args: { sessionToken: string; filename: string }) => Promise<{ uploadUrl: string; key: string }>;
}

const getFileText = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });

class R2AttachmentAdapter implements AttachmentAdapter {
    public accept = [
        // Images
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
        // Documents
        "application/pdf",
        "text/plain",
        "text/markdown",
        "text/csv",
        "application/json",
        "application/xml",
        "text/html",
        "text/css",
        // Code files
        "text/javascript",
        "application/javascript",
        "text/typescript",
        "application/typescript",
        "text/python",
        "application/python",
        "text/yaml",
        "application/yaml",
        // Archives
        "application/zip",
        "application/x-tar",
        "application/x-rar-compressed",
        // Office documents
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ].join(",");

    private config: R2AttachmentAdapterConfig;
    private fileMetadata = new Map<string, { fileId: string; url: string; size: number; contentType: string; uploadedAt: number }>();

    constructor(config: R2AttachmentAdapterConfig) {
        this.config = config;
    }

    public async add(state: { file: File }): Promise<PendingAttachment> {
        const { file } = state;

        // Validate file size (10MB limit)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            throw new Error(`File size exceeds 10MB limit. File is ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        }

        // Determine attachment type
        let type: "image" | "document" | "file" = "file";
        if (file.type.startsWith("image/")) {
            type = "image";
        } else if (
            file.type.includes("pdf") ||
            file.type.includes("document") ||
            file.type.includes("text/") ||
            file.type.includes("json") ||
            file.type.includes("xml")
        ) {
            type = "document";
        }

        return {
            id: `${Date.now()}-${file.name}`,
            type,
            name: file.name,
            contentType: file.type,
            file,
            status: { type: "requires-action", reason: "composer-send" },
        };
    }

    public async send(attachment: PendingAttachment): Promise<CompleteAttachment> {
        try {
            const { file } = attachment;
            if (!file) {
                throw new Error("No file provided");
            }

            // Convert file to ArrayBuffer for upload
            const arrayBuffer = await file.arrayBuffer();

            // Upload file using the upload action directly
            const { fileId, url } = await this.config.uploadFileAction({
                filename: file.name,
                mimeType: file.type,
                bytes: arrayBuffer,
                sessionToken: this.config.sessionToken,
            });

            // Store metadata for later use
            this.fileMetadata.set(attachment.id, {
                fileId,
                url,
                size: file.size,
                contentType: file.type,
                uploadedAt: Date.now(),
            });

            // Create content based on file type
            let content: CompleteAttachment["content"] = [];

            if (attachment.type === "image") {
                // For images, include both the image and a text description
                content = [
                    {
                        type: "image",
                        image: url,
                    },
                    {
                        type: "text",
                        text: `[Image: ${file.name}]`,
                    },
                ];
            } else if (attachment.type === "document" && file.type.startsWith("text/")) {
                // For text documents, include the content
                try {
                    const textContent = await getFileText(file);
                    content = [
                        {
                            type: "text",
                            text: `<document name="${file.name}">\n${textContent}\n</document>`,
                        },
                    ];
                } catch (error) {
                    // Fallback to file reference
                    content = [
                        {
                            type: "text",
                            text: `[Document: ${file.name}]`,
                        },
                    ];
                }
            } else {
                // For other files, just reference them
                content = [
                    {
                        type: "text",
                        text: `[File: ${file.name}]`,
                    },
                ];
            }

            return {
                ...attachment,
                status: { type: "complete" },
                content,
            };
        } catch (error) {
            console.error("File upload error:", error);
            return {
                ...attachment,
                status: { type: "complete" },
                content: [
                    {
                        type: "text",
                        text: `[Failed to upload: ${attachment.name}]`,
                    },
                ],
            };
        }
    }

    public async remove(attachment: CompleteAttachment): Promise<void> {
        try {
            // Get file metadata from our internal storage
            const metadata = this.fileMetadata.get(attachment.id);
            if (metadata?.fileId) {
                await this.config.deleteFileAction({
                    fileId: metadata.fileId,
                    sessionToken: this.config.sessionToken,
                });
                // Clean up our internal metadata
                this.fileMetadata.delete(attachment.id);
            }
        } catch (error) {
            console.error("File deletion error:", error);
            // Don't throw here as the attachment removal should still succeed
        }
    }

    // Helper method to get file metadata for external use
    public getFileMetadata(attachmentId: string) {
        return this.fileMetadata.get(attachmentId);
    }
}

export default R2AttachmentAdapter;
