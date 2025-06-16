import { useCallback } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUploadFile } from "@convex-dev/r2/react";

interface UseR2UploadConfig {
    sessionToken: string;
}

interface UploadResult {
    key: string;
    url: string;
    fileId?: string;
}

export function useR2Upload(config: UseR2UploadConfig) {
    // R2 upload using the official R2 component hook
    const uploadFileToR2 = useUploadFile(api.files.functions);

    // Manual R2 upload URL generation
    const generateUploadUrl = useMutation(api.files.functions.generateR2UploadUrl);
    const storeFileFromUrl = useAction(api.files.functions.storeFileFromUrl);
    const getFileUrl = useMutation(api.files.functions.getR2FileUrl);

    // Fallback to existing chat upload system
    const uploadFileForChat = useMutation(api.chat.functions.uploadFileForChat);

    const uploadFile = useCallback(
        async (file: File): Promise<UploadResult> => {
            try {
                // Method 1: Use the existing chat upload function (reliable fallback)
                const fileBytes = await file.arrayBuffer();
                const result = await uploadFileForChat({
                    filename: file.name,
                    mimeType: file.type,
                    bytes: new Uint8Array(fileBytes),
                    sessionToken: config.sessionToken,
                });

                return {
                    key: `chat-upload-${Date.now()}`, // Generate a key for tracking
                    url: result.url,
                    fileId: result.fileId,
                };
            } catch (error) {
                console.error("Upload failed:", error);
                throw error;
            }
        },
        [config.sessionToken, uploadFileForChat],
    );

    const uploadWithR2Hook = useCallback(
        async (file: File): Promise<UploadResult> => {
            try {
                // Method 2: Use the official R2 component hook
                const key = await uploadFileToR2(file);

                // Get the URL for the uploaded file
                const url = await getFileUrl({
                    key,
                    sessionToken: config.sessionToken,
                });

                return {
                    key,
                    url,
                };
            } catch (error) {
                console.error("R2 hook upload failed:", error);
                throw error;
            }
        },
        [uploadFileToR2, getFileUrl, config.sessionToken],
    );

    const uploadWithCustomUrl = useCallback(
        async (file: File): Promise<UploadResult> => {
            try {
                // Method 3: Manual R2 upload with custom URL generation
                const uploadUrlResult = await generateUploadUrl({
                    sessionToken: config.sessionToken,
                    filename: file.name,
                });

                // Upload the file to the signed URL
                const uploadResponse = await fetch(uploadUrlResult.uploadUrl, {
                    method: "POST",
                    headers: { "Content-Type": file.type },
                    body: file,
                });

                if (!uploadResponse.ok) {
                    throw new Error(`Upload failed: ${uploadResponse.statusText}`);
                }

                // Get the URL for the uploaded file
                const url = await getFileUrl({
                    key: uploadUrlResult.key,
                    sessionToken: config.sessionToken,
                });

                return {
                    key: uploadUrlResult.key,
                    url,
                };
            } catch (error) {
                console.error("Custom R2 upload failed:", error);
                throw error;
            }
        },
        [config.sessionToken, generateUploadUrl, getFileUrl],
    );

    const uploadFromUrl = useCallback(
        async (url: string, filename?: string, mimeType?: string): Promise<UploadResult> => {
            try {
                const result = await storeFileFromUrl({
                    url,
                    filename,
                    mimeType,
                    sessionToken: config.sessionToken,
                });

                return result;
            } catch (error) {
                console.error("Upload from URL failed:", error);
                throw error;
            }
        },
        [config.sessionToken, storeFileFromUrl],
    );

    return {
        uploadFile, // Fallback to existing chat system
        uploadWithR2Hook, // Official R2 component hook
        uploadWithCustomUrl, // Manual R2 upload with custom URL
        uploadFromUrl, // Upload from external URL
    };
}

export type { UploadResult, UseR2UploadConfig };
