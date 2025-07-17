import { api } from "@anole/convex/api";
import { Alert, AlertDescription } from "@anole/ui/components/alert";
import { Badge } from "@anole/ui/components/badge";
import { Button } from "@anole/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@anole/ui/components/card";
import { ImageEditor } from "@anole/ui/components/image-editor";
import { Progress } from "@anole/ui/components/progress";
import { useMutation, useQuery } from "convex/react";
import { AlertCircle, CheckCircle, Download, File, FileText, Image, Trash2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";

import { formatBytes, formatDate } from "@/lib/utils";

const FilesComponent = () => {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
    const [imageEditorOpen, setImageEditorOpen] = useState(false);
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
    const fileInputReference = useRef<HTMLInputElement>(null);

    const files = useQuery(api.attachments.listFiles, { limit: 100 });
    const deleteFile = useMutation(api.attachments.deleteFile);

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

        // Check if it's an image file
        const isImage = file.type.startsWith("image/");

        if (isImage) {
            // Open image editor for images
            setSelectedImageFile(file);
            setImageEditorOpen(true);

            return;
        }

        // For non-image files, upload directly
        await uploadFile(file);
    };

    const uploadFile = async (file: File) => {
        setUploading(true);
        setUploadProgress(0);
        setUploadError(null);
        setUploadSuccess(null);

        try {
            // Simulate upload progress
            const progressInterval = setInterval(() => {
                setUploadProgress((previous) => {
                    if (previous >= 90) {
                        clearInterval(progressInterval);

                        return 90;
                    }

                    return previous + 10;
                });
            }, 100);

            const formData = new FormData();

            formData.append("file", file);
            formData.append("fileName", file.name);

            const response = await fetch("/api/attachments/uploadFile", {
                body: formData,
                method: "POST",
            });

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (!response.ok) {
                const errorData = await response.json();

                throw new Error(errorData.error || "Upload failed");
            }

            const result = await response.json();

            setUploadSuccess(`File "${result.fileName}" uploaded successfully!`);

            // Reset file input
            if (fileInputReference.current) {
                fileInputReference.current.value = "";
            }

            // Clear success message after 3 seconds
            setTimeout(() => setUploadSuccess(null), 3000);
        } catch (error) {
            setUploadError(error instanceof Error ? error.message : "Upload failed");
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleImageSave = async (editedFile: File) => {
        await uploadFile(editedFile);
        setImageEditorOpen(false);
        setSelectedImageFile(null);
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
        } catch {
            setUploadError("Delete failed");
        }
    };

    const handleDownload = (url: string, fileName: string) => {
        const link = document.createElement("a");

        link.href = url;
        link.download = fileName;
        document.body.append(link);
        link.click();
        link.remove();
    };

    return (
        <div className="mx-auto w-full max-w-6xl space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Files</h1>
                    <p className="text-muted-foreground">Manage your uploaded files and attachments</p>
                </div>
                <Button className="flex items-center gap-2" disabled={uploading} onClick={() => fileInputReference.current?.click()}>
                    <Upload className="h-4 w-4" />
                    Upload File (Images will open in editor)
                </Button>
            </div>

            {/* Hidden file input */}
            <input
                accept="image/*,.txt,.pdf,.md,.mdx,.js,.jsx,.ts,.tsx,.py,.java,.c,.cpp,.go,.rs,.php,.rb,.swift,.kt,.dart,.vue,.svelte,.css,.scss,.html,.xml,.json,.yaml,.yml"
                className="hidden"
                onChange={handleFileUpload}
                ref={fileInputReference}
                type="file"
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
                            <Progress className="w-full" value={uploadProgress} />
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
                        <Button onClick={() => setUploadError(null)} size="sm" variant="ghost">
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
                        <Button onClick={() => setUploadSuccess(null)} size="sm" variant="ghost">
                            <X className="h-4 w-4" />
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            {/* Files Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {files?.map((file) => (
                    <Card className="transition-shadow hover:shadow-md" key={file.key}>
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    {getFileIcon(file.fileName, file.type)}
                                    <div className="min-w-0 flex-1">
                                        <CardTitle className="truncate text-sm">{file.fileName}</CardTitle>
                                        <CardDescription className="text-xs">{formatBytes(file.size)}</CardDescription>
                                    </div>
                                </div>
                                {getFileTypeBadge(file.fileName, file.type)}
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="text-muted-foreground mb-3 flex items-center justify-between text-xs">
                                <span>
                                    Uploaded
                                    {formatDate(file.uploadedAt)}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    className="flex-1"
                                    onClick={() => handleDownload(`/api/attachments/getFile?key=${encodeURIComponent(file.key)}`, file.fileName)}
                                    size="sm"
                                    variant="outline"
                                >
                                    <Download className="mr-1 h-3 w-3" />
                                    Download
                                </Button>
                                <Button
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteFile(file.key, file.fileName)}
                                    size="sm"
                                    variant="outline"
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
                        <File className="text-muted-foreground mb-4 h-12 w-12" />
                        <h3 className="mb-2 text-lg font-semibold">No files uploaded yet</h3>
                        <p className="text-muted-foreground mb-4 text-center">
                            Upload your first file to get started. Supported formats include text files, PDFs, and images.
                        </p>
                        <Button className="flex items-center gap-2" onClick={() => fileInputReference.current?.click()}>
                            <Upload className="h-4 w-4" />
                            Upload File (Images will open in editor)
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Loading State */}
            {files === undefined && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <Card key={index}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="bg-muted h-8 w-8 animate-pulse rounded" />
                                    <div className="flex-1 space-y-2">
                                        <div className="bg-muted h-4 animate-pulse rounded" />
                                        <div className="bg-muted h-3 w-1/2 animate-pulse rounded" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="bg-muted h-8 animate-pulse rounded" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Image Editor */}
            <ImageEditor
                isOpen={imageEditorOpen}
                onClose={() => {
                    setImageEditorOpen(false);
                    setSelectedImageFile(null);
                }}
                onSave={handleImageSave}
                originalFile={selectedImageFile}
            />
        </div>
    );
};

export default FilesComponent;
