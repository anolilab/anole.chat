import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RotateCcw, RotateCw, ZoomIn, ZoomOut, Crop, Download, X } from "lucide-react";

interface ImageEditorProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (file: File) => void;
    originalFile: File | null;
}

interface CropArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({
    isOpen,
    onClose,
    onSave,
    originalFile
}) => {
    const [rotation, setRotation] = useState(0);
    const [scale, setScale] = useState(1);
    const [cropArea, setCropArea] = useState<CropArea | null>(null);
    const [isCropping, setIsCropping] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    // Load and process image when file changes
    React.useEffect(() => {
        if (originalFile && isOpen) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    if (imageRef.current) {
                        imageRef.current.src = e.target?.result as string;
                        drawImage();
                    }
                };
                img.src = e.target?.result as string;
            };
            reader.readAsDataURL(originalFile);
        }
    }, [originalFile, isOpen]);

    const drawImage = useCallback(() => {
        const canvas = canvasRef.current;
        const image = imageRef.current;
        if (!canvas || !image) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Save context
        ctx.save();

        // Move to center
        ctx.translate(canvas.width / 2, canvas.height / 2);

        // Apply transformations
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(scale, scale);

        // Draw image centered
        const imgWidth = image.naturalWidth;
        const imgHeight = image.naturalHeight;
        ctx.drawImage(image, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);

        // Draw crop overlay if cropping
        if (isCropping && cropArea) {
            ctx.restore();
            ctx.save();

            // Semi-transparent overlay
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Clear crop area
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);

            // Crop border
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
        }

        ctx.restore();
    }, [rotation, scale, isCropping, cropArea]);

    React.useEffect(() => {
        drawImage();
    }, [drawImage]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!isCropping) return;

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setIsDragging(true);
        setDragStart({ x, y });
        setCropArea({ x, y, width: 0, height: 0 });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !isCropping) return;

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setCropArea(prev => {
            if (!prev) return null;
            return {
                x: Math.min(dragStart.x, x),
                y: Math.min(dragStart.y, y),
                width: Math.abs(x - dragStart.x),
                height: Math.abs(y - dragStart.y)
            };
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const rotateLeft = () => setRotation(prev => prev - 90);
    const rotateRight = () => setRotation(prev => prev + 90);
    const zoomIn = () => setScale(prev => Math.min(prev + 0.1, 3));
    const zoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.1));
    const resetTransform = () => {
        setRotation(0);
        setScale(1);
        setCropArea(null);
        setIsCropping(false);
    };

    const toggleCrop = () => {
        setIsCropping(!isCropping);
        if (!isCropping) {
            setCropArea(null);
        }
    };

    const applyCrop = () => {
        if (!cropArea || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        if (!tempCtx) return;

        tempCanvas.width = cropArea.width;
        tempCanvas.height = cropArea.height;

        // Draw the cropped portion
        tempCtx.drawImage(
            canvas,
            cropArea.x, cropArea.y, cropArea.width, cropArea.height,
            0, 0, cropArea.width, cropArea.height
        );

        // Convert to blob and create new file
        tempCanvas.toBlob((blob) => {
            if (blob && originalFile) {
                const newFile = new File([blob], originalFile.name, {
                    type: originalFile.type,
                    lastModified: Date.now()
                });
                onSave(newFile);
                onClose();
            }
        }, originalFile?.type || 'image/png');
    };

    const saveImage = () => {
        if (!canvasRef.current || !originalFile) return;

        canvasRef.current.toBlob((blob) => {
            if (blob) {
                const newFile = new File([blob], originalFile.name, {
                    type: originalFile.type,
                    lastModified: Date.now()
                });
                onSave(newFile);
                onClose();
            }
        }, originalFile.type || 'image/png');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>Edit Image</span>
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                    {/* Image Canvas */}
                    <div className="relative bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center min-h-[400px]">
                        <canvas
                            ref={canvasRef}
                            width={800}
                            height={600}
                            className="max-w-full max-h-[400px] cursor-crosshair"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        />
                        <img
                            ref={imageRef}
                            alt="Original"
                            className="hidden"
                            crossOrigin="anonymous"
                        />
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col gap-4">
                        {/* Toolbar */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={rotateLeft}
                                className="flex items-center gap-2"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Rotate Left
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={rotateRight}
                                className="flex items-center gap-2"
                            >
                                <RotateCw className="h-4 w-4" />
                                Rotate Right
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={zoomOut}
                                className="flex items-center gap-2"
                            >
                                <ZoomOut className="h-4 w-4" />
                                Zoom Out
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={zoomIn}
                                className="flex items-center gap-2"
                            >
                                <ZoomIn className="h-4 w-4" />
                                Zoom In
                            </Button>
                            <Button
                                variant={isCropping ? "default" : "outline"}
                                size="sm"
                                onClick={toggleCrop}
                                className="flex items-center gap-2"
                            >
                                <Crop className="h-4 w-4" />
                                Crop
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={resetTransform}
                            >
                                Reset
                            </Button>
                        </div>

                        {/* Manual Controls */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Rotation: {rotation}°</label>
                                <Input
                                    type="number"
                                    value={rotation}
                                    onChange={(e) => setRotation(Number(e.target.value))}
                                    min={-180}
                                    max={180}
                                    step={1}
                                    className="w-full"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Scale: {scale.toFixed(1)}x</label>
                                <Input
                                    type="number"
                                    value={scale}
                                    onChange={(e) => setScale(Number(e.target.value))}
                                    min={0.1}
                                    max={3}
                                    step={0.1}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 justify-end">
                            {isCropping && cropArea && (
                                <Button onClick={applyCrop} className="flex items-center gap-2">
                                    <Crop className="h-4 w-4" />
                                    Apply Crop
                                </Button>
                            )}
                            <Button onClick={saveImage} className="flex items-center gap-2">
                                <Download className="h-4 w-4" />
                                Save Image
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};