"use client";

import { useState, useRef, type ChangeEvent } from "react";

import { Upload, X, File, Image, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FileUploadProps {
    onFileSelect?: (files: File[]) => void;
    onFileRemove?: (index: number) => void;
    accept?: string;
    multiple?: boolean;
    maxSize?: number; // in MB
    maxFiles?: number;
    className?: string;
    disabled?: boolean;
}

interface UploadedFile {
    file: File;
    preview?: string;
    id: string;
}

const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return Image;
    if (type.includes("pdf") || type.startsWith("text/")) return FileText;
    return File;
};

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const FileUpload = ({
    onFileSelect,
    onFileRemove,
    accept = "image/*,application/pdf,text/*,.doc,.docx,.json,.csv",
    multiple = true,
    maxSize = 10, // 10MB default
    maxFiles = 5,
    className,
    disabled = false,
}: FileUploadProps) => {
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFiles = (files: FileList | null) => {
        if (!files) return;

        const fileArray = Array.from(files);
        const validFiles: File[] = [];
        const errors: string[] = [];

        fileArray.forEach((file) => {
            // Check file size
            if (file.size > maxSize * 1024 * 1024) {
                errors.push(`${file.name} is too large (max ${maxSize}MB)`);
                return;
            }

            // Check total files limit
            if (uploadedFiles.length + validFiles.length >= maxFiles) {
                errors.push(`Maximum ${maxFiles} files allowed`);
                return;
            }

            validFiles.push(file);
        });

        if (errors.length > 0) {
            console.warn("File upload errors:", errors);
            // You could show these errors in a toast or alert
        }

        if (validFiles.length > 0) {
            const newUploadedFiles: UploadedFile[] = validFiles.map((file) => ({
                file,
                id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
            }));

            setUploadedFiles((prev) => [...prev, ...newUploadedFiles]);
            onFileSelect?.(validFiles);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (disabled) return;

        const files = e.dataTransfer.files;
        handleFiles(files);
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (disabled) return;
        handleFiles(e.target.files);
    };

    const removeFile = (index: number) => {
        const fileToRemove = uploadedFiles[index];
        if (fileToRemove.preview) {
            URL.revokeObjectURL(fileToRemove.preview);
        }

        setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
        onFileRemove?.(index);
    };

    const openFileDialog = () => {
        if (disabled) return;
        inputRef.current?.click();
    };

    return (
        <div className={cn("w-full", className)}>
            {/* Upload Area */}
            <div
                className={cn(
                    "relative rounded-lg border-2 border-dashed p-6 transition-colors",
                    dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                    disabled ? "cursor-not-allowed opacity-50" : "hover:border-primary/50 cursor-pointer",
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={openFileDialog}
            >
                <Input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleChange}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    disabled={disabled}
                />

                <div className="flex flex-col items-center justify-center text-center">
                    <Upload className="text-muted-foreground mb-4 h-10 w-10" />
                    <Label className="mb-2 text-sm font-medium">{dragActive ? "Drop files here" : "Click to upload or drag and drop"}</Label>
                    <p className="text-muted-foreground text-xs">
                        Max {maxSize}MB per file, up to {maxFiles} files
                    </p>
                </div>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                    <Label className="text-sm font-medium">Uploaded Files ({uploadedFiles.length})</Label>
                    <div className="space-y-2">
                        {uploadedFiles.map((uploadedFile, index) => {
                            const IconComponent = getFileIcon(uploadedFile.file.type);
                            return (
                                <div key={uploadedFile.id} className="bg-muted/30 flex items-center gap-3 rounded-lg border p-3">
                                    {uploadedFile.preview ? (
                                        <img src={uploadedFile.preview} alt={uploadedFile.file.name} className="h-10 w-10 rounded object-cover" />
                                    ) : (
                                        <IconComponent className="text-muted-foreground h-10 w-10" />
                                    )}

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">{uploadedFile.file.name}</p>
                                        <p className="text-muted-foreground text-xs">
                                            {formatFileSize(uploadedFile.file.size)} • {uploadedFile.file.type}
                                        </p>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeFile(index);
                                        }}
                                        disabled={disabled}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
