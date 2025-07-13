import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useRef } from "react";
import {
    FileText,
    Image,
    File,
    Download,
    Trash2,
    Upload,
    AlertCircle,
    CheckCircle,
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { formatBytes, formatDate } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/files")({
    component: FilesComponent,
});

const FilesComponent = () => {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const files = useQuery(api.attachments.listFiles, { limit: 100 });
    const deleteFile = useMutation(api.attachments.deleteFile);
    const uploadFile = useMutation(api.attachments.uploadFile);

    const getFileIcon = (fileName: string, mimeType: string) => {
        if (mimeType.startsWith("image/")) return <Image className="h-8 w-8 text-blue-500" />;
        if (mimeType.includes("pdf")) return <FileText className="h-8 w-8 text-red-500" />;
        if (mimeType.includes("text")) return <FileText className="h-8 w-8 text-green-500" />;
        return <File className="h-8 w-8 text-gray-500" />;
    };

    const getFileTypeBadge = (fileName: string, mimeType: string) => {
        if (mimeType.startsWith("image/")) return <Badge variant="secondary">Image</Badge>;
        if (mimeType.includes("pdf")) return <Badge variant="destructive">PDF</Badge>;
        if (mimeType.includes("text")) return <Badge variant="default">Text</Badge>;
        return <Badge variant="outline">File</Badge>;
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setUploadProgress(0);
        setUploadError(null);
        setUploadSuccess(null);

        try {
            // Simulate upload progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 100);

            // Convert file to bytes
            const arrayBuffer = await file.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);

            const result = await uploadFile({
                bytes,
                filename: file.name,
                mimeType: file.type,
            });

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (result.success) {
                setUploadSuccess(`File "${result.fileName}" uploaded successfully!`);

                // Reset file input
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }

                // Clear success message after 3 seconds
                setTimeout(() => setUploadSuccess(null), 3000);
            } else {
                throw new Error("Upload failed");
            }
        } catch (error) {
            setUploadError(error instanceof Error ? error.message : "Upload failed");
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleDeleteFile = async (key: string, fileName: string) => {
        if (!confirm(`Are you sure you want to delete "${fileName}"?`)) return;

        try {
            const result = await deleteFile({ key });
            if (result.success) {
                setUploadSuccess(`File "${fileName}" deleted successfully!`);
                setTimeout(() => setUploadSuccess(null), 3000);
            } else {
                setUploadError(result.error || "Delete failed");
            }
        } catch (error) {
            setUploadError("Delete failed");
        }
    };

    const handleDownload = (url: string, fileName: string) => {
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Files</h1>
                    <p className="text-muted-foreground">
                        Manage your uploaded files and attachments
                    </p>
                </div>
                <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2"
                >
                    <Upload className="h-4 w-4" />
                    Upload File
                </Button>
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                accept=".txt,.pdf,.md,.json,.csv,.jpg,.jpeg,.png,.gif,.webp"
            />

            {/* Upload Progress */}
            {uploading && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span>Uploading file...</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <Progress value={uploadProgress} className="w-full" />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Error Alert */}
            {uploadError && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                        {uploadError}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setUploadError(null)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            {/* Success Alert */}
            {uploadSuccess && (
                <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                        {uploadSuccess}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setUploadSuccess(null)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            {/* Files Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {files?.map((file) => (
                    <Card key={file.key} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    {getFileIcon(file.fileName, file.type)}
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-sm truncate">
                                            {file.fileName}
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            {formatBytes(file.size)}
                                        </CardDescription>
                                    </div>
                                </div>
                                {getFileTypeBadge(file.fileName, file.type)}
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                                <span>Uploaded {formatDate(file.uploadedAt)}</span>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownload(`/api/agent/files/${file.key}`, file.fileName)}
                                    className="flex-1"
                                >
                                    <Download className="h-3 w-3 mr-1" />
                                    Download
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteFile(file.key, file.fileName)}
                                    className="text-destructive hover:text-destructive"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Empty State */}
            {files && files.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <File className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No files uploaded yet</h3>
                        <p className="text-muted-foreground text-center mb-4">
                            Upload your first file to get started. Supported formats include text files, PDFs, and images.
                        </p>
                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2"
                        >
                            <Upload className="h-4 w-4" />
                            Upload File
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Loading State */}
            {files === undefined && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-muted rounded animate-pulse" />
                                        <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="h-8 bg-muted rounded animate-pulse" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};