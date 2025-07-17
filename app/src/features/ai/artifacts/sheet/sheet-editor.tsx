import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ArtifactContent } from "../../types/artifacts";

function parseCSV(csv: string): string[][] {
    if (!csv.trim()) return [];
    
    const lines = csv.split('\n');
    return lines.map(line => {
        // Simple CSV parsing - split by comma and trim whitespace
        return line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
    });
}

function formatCSV(data: string[][]): string {
    return data.map(row => row.join(', ')).join('\n');
}

export function SheetEditor({
    content,
    isCurrentVersion,
    currentVersionIndex,
    status,
    onSaveContent,
    isReadonly,
}: ArtifactContent) {
    const [localContent, setLocalContent] = useState(content);
    const [isEditing, setIsEditing] = useState(false);
    const [viewMode, setViewMode] = useState<"table" | "raw">("table");

    useEffect(() => {
        setLocalContent(content);
    }, [content]);

    const handleSave = () => {
        onSaveContent(localContent, false);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setLocalContent(content);
        setIsEditing(false);
    };

    const csvData = parseCSV(localContent);
    const hasData = csvData.length > 0 && csvData[0].length > 0;

    if (status === "streaming") {
        return (
            <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Sheet Document</h3>
                    <Badge variant="secondary">Streaming...</Badge>
                </div>
                <Card>
                    <CardContent className="p-4">
                        <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                            <pre className="whitespace-pre-wrap">
                                {localContent}
                                {status === "streaming" && (
                                    <span className="animate-pulse">▋</span>
                                )}
                            </pre>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Sheet Document</h3>
                <div className="flex items-center space-x-2">
                    {!isCurrentVersion && (
                        <Badge variant="outline">
                            Version {currentVersionIndex + 1}
                        </Badge>
                    )}
                    {hasData && (
                        <div className="flex items-center space-x-2">
                            <Button
                                variant={viewMode === "table" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setViewMode("table")}
                            >
                                Table
                            </Button>
                            <Button
                                variant={viewMode === "raw" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setViewMode("raw")}
                            >
                                Raw
                            </Button>
                        </div>
                    )}
                    {!isReadonly && (
                        <Button
                            variant={isEditing ? "default" : "outline"}
                            size="sm"
                            onClick={() => setIsEditing(!isEditing)}
                        >
                            {isEditing ? "View" : "Edit"}
                        </Button>
                    )}
                </div>
            </div>

            <Card>
                <CardContent className="p-4">
                    {isEditing ? (
                        <div className="space-y-4">
                            <Textarea
                                value={localContent}
                                onChange={(e) => setLocalContent(e.target.value)}
                                placeholder="Enter CSV data here (comma-separated values)..."
                                className="min-h-[400px] resize-none font-mono text-sm"
                            />
                            <div className="flex justify-end space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCancel}
                                >
                                    Cancel
                                </Button>
                                <Button size="sm" onClick={handleSave}>
                                    Save
                                </Button>
                            </div>
                        </div>
                    ) : viewMode === "table" && hasData ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {csvData[0].map((header, index) => (
                                            <TableHead key={index} className="font-semibold">
                                                {header}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {csvData.slice(1).map((row, rowIndex) => (
                                        <TableRow key={rowIndex}>
                                            {row.map((cell, cellIndex) => (
                                                <TableCell key={cellIndex}>
                                                    {cell}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                            <pre className="whitespace-pre-wrap">{localContent}</pre>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}