import React, { useRef, useState } from "react";
import { useR2Upload } from "../hooks/useR2Upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileIcon, CheckCircle, AlertCircle } from "lucide-react";

interface R2FileUploadProps {
    sessionToken: string;
    onFileUploaded?: (result: { key: string; url: string; fileId?: string }) => void;
}

export function R2FileUpload({ sessionToken, onFileUploaded }: R2FileUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<{ key: string; url: string; fileId?: string } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const { uploadFile, uploadWithR2Hook, uploadWithCustomUrl, uploadFromUrl } = useR2Upload({ sessionToken });

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError(null);
        setUploadResult(null);

        try {
            // Use the standard upload method (works with current system)
            const result = await uploadFile(file);
            setUploadResult(result);
            onFileUploaded?.(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleR2HookUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError(null);
        setUploadResult(null);

        try {
            // Use the official R2 component hook
            const result = await uploadWithR2Hook(file);
            setUploadResult(result);
            onFileUploaded?.(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "R2 hook upload failed");
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleCustomR2Upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError(null);
        setUploadResult(null);

        try {
            // Use the custom R2 upload method
            const result = await uploadWithCustomUrl(file);
            setUploadResult(result);
            onFileUploaded?.(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Custom R2 upload failed");
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    File Upload
                </CardTitle>
                <CardDescription>Upload files using Convex storage or R2 (when available)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Standard Upload */}
                <div>
                    <label htmlFor="file-upload" className="mb-2 block text-sm font-medium">
                        Standard Upload (Convex)
                    </label>
                    <Input
                        id="file-upload"
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        disabled={uploading}
                        accept="image/*,application/pdf,.txt,.doc,.docx"
                    />
                </div>

                {/* R2 Hook Upload */}
                <div>
                    <label htmlFor="r2-hook-upload" className="mb-2 block text-sm font-medium">
                        R2 Hook Upload (Official)
                    </label>
                    <Input
                        id="r2-hook-upload"
                        type="file"
                        onChange={handleR2HookUpload}
                        disabled={uploading}
                        accept="image/*,application/pdf,.txt,.doc,.docx"
                    />
                </div>

                {/* Custom R2 Upload */}
                <div>
                    <label htmlFor="custom-r2-upload" className="mb-2 block text-sm font-medium">
                        Custom R2 Upload
                    </label>
                    <Input
                        id="custom-r2-upload"
                        type="file"
                        onChange={handleCustomR2Upload}
                        disabled={uploading}
                        accept="image/*,application/pdf,.txt,.doc,.docx"
                    />
                </div>

                {/* Upload Status */}
                {uploading && (
                    <div className="flex items-center gap-2 text-blue-600">
                        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600"></div>
                        <span className="text-sm">Uploading...</span>
                    </div>
                )}

                {/* Success */}
                {uploadResult && (
                    <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 p-3">
                        <CheckCircle className="mt-0.5 h-4 w-4 text-green-600" />
                        <div className="flex-1 text-sm">
                            <p className="font-medium text-green-800">Upload successful!</p>
                            <p className="break-all text-green-600">Key: {uploadResult.key}</p>
                            {uploadResult.fileId && <p className="text-green-600">File ID: {uploadResult.fileId}</p>}
                            <a href={uploadResult.url} target="_blank" rel="noopener noreferrer" className="text-green-700 underline hover:text-green-800">
                                View file
                            </a>
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3">
                        <AlertCircle className="mt-0.5 h-4 w-4 text-red-600" />
                        <div className="flex-1 text-sm">
                            <p className="font-medium text-red-800">Upload failed</p>
                            <p className="text-red-600">{error}</p>
                        </div>
                    </div>
                )}

                {/* Upload Instructions */}
                <div className="space-y-1 text-xs text-gray-500">
                    <p>• Standard upload uses Convex storage (reliable fallback)</p>
                    <p>• R2 Hook upload uses the official @convex-dev/r2 component</p>
                    <p>• Custom R2 upload uses manual signed URL generation</p>
                    <p>• All methods work with the chat system</p>
                </div>
            </CardContent>
        </Card>
    );
}

export default R2FileUpload;
