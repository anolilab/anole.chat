"use client";

import { useState } from "react";

import { FileUp, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";

export default function UploadComponent() {
    const [files, setFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [title, setTitle] = useState<string>();
    const [progress, setProgress] = useState(0);
    const [content, setContent] = useState<string>();

    const { mutate: uploadMutation, isPending } = useMutation(
        api.resources.upload.mutationOptions({
            onSuccess: (data) => {
                setProgress(100);
                setContent(data.id);
                toast.success(`PDF processed with ${data.pageCount} pages`);
            },
            onError: (error) => {
                console.log(error);
                toast.error(error.message);
            },
        }),
    );

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

        if (isSafari && isDragging) {
            toast.error("Safari does not support drag & drop. Please use the file picker.");
            return;
        }

        const selectedFiles = Array.from(e.target.files || []);
        const validFiles = selectedFiles.filter((file) => file.type === "application/pdf" && file.size <= 5 * 1024 * 1024);
        console.log(validFiles);

        if (validFiles.length !== selectedFiles.length) {
            toast.error("Only PDF files under 5MB are allowed.");
        }

        setFiles(validFiles);
    };

    const handleSubmitWithFiles = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (files.length === 0) return;

        const file = files[0];
        setTitle(file.name);
        setProgress(10);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", file.name);
        uploadMutation(formData);
    };

    // Function to reset the component state
    const clearPDF = () => {
        setFiles([]);
        setTitle(undefined);
        setProgress(0);
        setContent(undefined);
    };

    return (
        <div
            className="sticky top-4 flex max-h-[calc(100vh-2rem)] min-h-[200px] w-full justify-center overflow-visible"
            onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
            }}
            onDragExit={() => setIsDragging(false)}
            onDragEnd={() => setIsDragging(false)}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                console.log(e.dataTransfer.files);
                handleFileChange({
                    target: { files: e.dataTransfer.files },
                } as React.ChangeEvent<HTMLInputElement>);
            }}
        >
            <AnimatePresence>
                {isDragging && (
                    <motion.div
                        className="pointer-events-none fixed z-10 flex h-dvh w-dvw flex-col items-center justify-center gap-1 bg-zinc-100/90 dark:bg-zinc-900/90"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div>Drag and drop files here</div>
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">{"(PDFs only)"}</div>
                    </motion.div>
                )}
            </AnimatePresence>
            <Card className="mt-12 h-full w-full max-w-md border-0 sm:h-fit sm:border">
                <CardHeader className="space-y-6 text-center">
                    <div className="text-muted-foreground mx-auto flex items-center justify-center space-x-2">
                        <div className="bg-primary/10 rounded-full p-2">
                            <FileUp className="h-6 w-6" />
                        </div>
                        <Plus className="h-4 w-4" />
                        <div className="bg-primary/10 rounded-full p-2">
                            <Loader2 className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <CardTitle className="text-2xl font-bold">PDF Embeddings Generator</CardTitle>
                        <CardDescription className="text-base">Upload a PDF to generate embeddings for the content</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmitWithFiles} className="space-y-4">
                        <div
                            className={
                                "border-muted-foreground/25 hover:border-muted-foreground/50 relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors"
                            }
                        >
                            <input type="file" onChange={handleFileChange} accept="application/pdf" className="absolute inset-0 cursor-pointer opacity-0" />
                            <FileUp className="text-muted-foreground mb-2 h-8 w-8" />
                            <p className="text-muted-foreground text-center text-sm">
                                {files.length > 0 ? (
                                    <span className="text-foreground font-medium">{files[0].name}</span>
                                ) : (
                                    <span>Drop your PDF here or click to browse.</span>
                                )}
                            </p>
                        </div>
                        <div className="flex space-x-2">
                            <Button type="submit" className="flex-1" disabled={files.length === 0 || isPending}>
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    "Upload File"
                                )}
                            </Button>
                            {files.length > 0 && (
                                <Button type="button" variant="outline" onClick={clearPDF} disabled={isPending}>
                                    Clear
                                </Button>
                            )}
                        </div>
                    </form>
                </CardContent>
                {title && (
                    <CardFooter className="flex flex-col space-y-4">
                        <div className="w-full space-y-1">
                            <div className="text-muted-foreground flex justify-between text-sm">
                                <span>Progress</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>
                        <div className="w-full space-y-2">
                            <div className="grid grid-cols-6 items-center space-x-2 text-sm sm:grid-cols-4">
                                <div className={`h-2 w-2 rounded-full ${isPending ? "animate-pulse bg-yellow-500/50" : "bg-muted"}`} />
                                <span className="text-muted-foreground col-span-4 text-center sm:col-span-2">
                                    {isPending ? "Analyzing PDF content..." : "Processing complete"}
                                </span>
                            </div>
                        </div>
                    </CardFooter>
                )}
                {content && (
                    <CardContent className="mt-2 border-t pt-4">
                        <div className="mb-2 text-sm font-medium">Content Preview:</div>
                        <div className="bg-muted/50 max-h-40 overflow-y-auto rounded border p-2 text-xs">
                            {content.slice(0, 500)}
                            {content.length > 500 && "..."}
                        </div>
                    </CardContent>
                )}
            </Card>
        </div>
    );
}
